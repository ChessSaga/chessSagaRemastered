import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from './_lib/http.js'
import {userOwnsCourse} from './_lib/purchase.js'
import {getVerifiedUserByAccessToken} from './_lib/supabaseAuth.js'
import {sanityServerClient} from './_lib/sanity.js'

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    const payload = await parseJsonBody(req)
    const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : ''
    const courseId = typeof payload.courseId === 'string' ? payload.courseId.trim() : ''

    const user = await getVerifiedUserByAccessToken(accessToken)
    if (!user.success) {
      return sendJson(res, 401, {
        success: false,
        error: user.message,
      })
    }

    const email = user.email

    if (!courseId) {
      return sendJson(res, 400, {
        success: false,
        error: 'courseId is required',
      })
    }

    const ownsCourse = await userOwnsCourse(email, courseId)
    if (!ownsCourse) {
      return sendJson(res, 403, {
        success: false,
        error: 'You do not own this course',
      })
    }

    const lectures = await sanityServerClient.fetch(
      `*[_type == 'lecture' && course._ref == $courseId] | order(order asc){
        _id,
        title,
        videoKey,
        order,
        duration
      }`,
      {courseId}
    )

    return sendJson(res, 200, {
      success: true,
      courseId,
      lectures: lectures || [],
      empty: !lectures || lectures.length === 0,
    })
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: 'Unable to fetch lectures',
      details: error.message,
    })
  }
}
