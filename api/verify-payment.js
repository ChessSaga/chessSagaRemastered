import crypto from 'crypto'
import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from './_lib/http.js'
import {sanityServerClient} from './_lib/sanity.js'

function isValidSignature(orderId, paymentId, signature, secret) {
  const generated = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return generated === signature
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

    const existing = await sanityServerClient.fetch(
      "*[_type == 'purchase' && razorpayPaymentId == $paymentId][0]{_id}",
      {paymentId: razorpayPaymentId}
    )

    if (existing?._id) {
      return sendJson(res, 200, {
        success: true,
        verified: true,
        purchaseId: existing._id,
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
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount,
      currency: course.currency || 'INR',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
    })

    return sendJson(res, 200, {
      success: true,
      verified: true,
      purchaseId: doc._id,
    })
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: 'Unable to verify payment',
      details: error.message,
    })
  }
}
