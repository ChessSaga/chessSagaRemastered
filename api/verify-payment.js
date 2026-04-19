import crypto from 'crypto'
import Razorpay from 'razorpay'
import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from './_lib/http.js'
import {sanityServerClient} from './_lib/sanity.js'
import {provisionSupabaseUserAndSendPasswordSetup} from './_lib/supabaseProvisioning.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidSignature(orderId, paymentId, signature, secret) {
  const generated = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return generated === signature
}

async function resolveBuyerEmail({providedEmail, paymentId, orderId}) {
  const normalized = String(providedEmail || '').trim().toLowerCase()
  if (!emailRegex.test(normalized)) {
    throw new Error('A valid buyerEmail is required for verification')
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
  })

  const payment = await razorpay.payments.fetch(paymentId)
  const paymentEmail = String(payment?.email || payment?.notes?.buyerEmail || '').trim().toLowerCase()
  if (emailRegex.test(paymentEmail) && paymentEmail !== normalized) {
    throw new Error('Email mismatch between form and payment details. Please use the same email for checkout.')
  }

  const derivedOrderId = String(payment?.order_id || orderId || '').trim()
  if (derivedOrderId) {
    const order = await razorpay.orders.fetch(derivedOrderId)
    const orderEmail = String(order?.notes?.buyerEmail || '').trim().toLowerCase()
    if (emailRegex.test(orderEmail) && orderEmail !== normalized) {
      throw new Error('Email mismatch between form and order details. Please use the same email for checkout.')
    }
  }

  return normalized
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      courseId,
      buyerName = '',
      buyerWhatsApp = '',
      buyerEmail = '',
    } = await parseJsonBody(req)

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !courseId) {
      return sendJson(res, 400, {
        success: false,
        error: 'Missing required payment verification fields',
      })
    }

    const verified = isValidSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      process.env.RAZORPAY_SECRET_KEY
    )

    if (!verified) {
      return sendJson(res, 400, {
        success: false,
        error: 'Payment signature verification failed',
      })
    }

    const normalizedEmail = await resolveBuyerEmail({
      providedEmail: buyerEmail,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
    })

    const existing = await sanityServerClient.fetch(
      "*[_type == 'purchase' && razorpayPaymentId == $paymentId][0]{_id}",
      {paymentId: razorpayPaymentId}
    )

    if (existing?._id) {
      const onboarding = await provisionSupabaseUserAndSendPasswordSetup(normalizedEmail)

      return sendJson(res, 200, {
        success: true,
        verified: true,
        purchaseId: existing._id,
        onboarding,
      })
    }

    const course = await sanityServerClient.fetch(
      "*[_type == 'course' && _id == $courseId][0]{_id, price, currency}",
      {courseId}
    )

    if (!course?._id) {
      return sendJson(res, 404, {
        success: false,
        error: 'Course not found for purchase record',
      })
    }

    const amount = Math.round(Number(course.price) * 100)

    const doc = await sanityServerClient.create({
      _type: 'purchase',
      course: {_type: 'reference', _ref: course._id},
      buyerName: String(buyerName).trim().slice(0, 100),
      buyerWhatsApp: String(buyerWhatsApp).trim().slice(0, 20),
      buyerEmail: normalizedEmail,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount,
      currency: course.currency || 'INR',
      status: 'success',
      verifiedAt: new Date().toISOString(),
    })

    const onboarding = await provisionSupabaseUserAndSendPasswordSetup(normalizedEmail)

    return sendJson(res, 200, {
      success: true,
      verified: true,
      purchaseId: doc._id,
      onboarding,
    })
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: 'Unable to verify payment',
      details: error.message,
    })
  }
}
