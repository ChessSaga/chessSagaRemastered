import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from './_lib/http.js'
import {getPurchasedCoursesByEmail} from './_lib/purchase.js'
import {getVerifiedUserByAccessToken} from './_lib/supabaseAuth.js'

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    const payload = await parseJsonBody(req)
    const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : ''

    const user = await getVerifiedUserByAccessToken(accessToken)
    if (!user.success) {
      return sendJson(res, 401, {
        success: false,
        error: user.message,
      })
    }

    const email = user.email

    const purchases = await getPurchasedCoursesByEmail(email)
    if (!purchases.success) {
      return sendJson(res, 200, {
        success: true,
        courses: [],
        empty: true,
      })
    }

    return sendJson(res, 200, {
      success: true,
      courses: purchases.courses.map((item) => ({
        courseId: item.courseId,
        title: item.title,
      })),
      empty: purchases.courses.length === 0,
    })
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: 'Unable to fetch user courses',
      details: error.message,
    })
  }
}
