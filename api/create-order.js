import Razorpay from 'razorpay'
import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from './_lib/http.js'
import {sanityServerClient} from './_lib/sanity.js'

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
      return sendJson(res, 500, {success: false, error: 'Razorpay credentials not configured'})
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    })
    const {courseId, buyerName = '', buyerWhatsApp = ''} = await parseJsonBody(req)

    if (!courseId) {
      return sendJson(res, 400, {success: false, error: 'courseId is required'})
    }

    const course = await sanityServerClient.fetch(
      "*[_type == 'course' && _id == $courseId && isActive == true][0]{_id, title, price, currency}",
      {courseId}
    )

    if (!course || !course.price) {
      return sendJson(res, 404, {success: false, error: 'Active course not found'})
    }

    const amount = Math.round(Number(course.price) * 100)
    if (!Number.isFinite(amount) || amount <= 0) {
      return sendJson(res, 400, {success: false, error: 'Invalid course price'})
    }

    const order = await razorpay.orders.create({
      amount,
      currency: course.currency || 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        courseId: course._id,
        courseTitle: course.title,
        buyerName: String(buyerName).slice(0, 100),
        buyerWhatsApp: String(buyerWhatsApp).slice(0, 20),
      },
    })

    return sendJson(res, 200, {
      success: true,
      order,
      course,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    const detail = error?.message || error?.error?.description || JSON.stringify(error)
    return sendJson(res, 500, {
      success: false,
      error: 'Unable to create payment order',
      details: detail,
    })
  }
}
