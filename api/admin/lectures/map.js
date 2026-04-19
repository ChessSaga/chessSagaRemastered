import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from '../../_lib/http.js'
import {verifyAdmin} from '../../../lib/auth.js'
import {fetchCourses, fetchLecturesWithCourse, updateLectureVideoKey} from '../../../lib/sanityClient.js'

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['GET', 'POST'])) return

  try {
    verifyAdmin(req)

    if (req.method === 'GET') {
      const [courses, lectures] = await Promise.all([fetchCourses(), fetchLecturesWithCourse()])
      return sendJson(res, 200, {
        success: true,
        courses,
        lectures,
      })
    }

    const payload = await parseJsonBody(req)
    const lectureId = String(payload.lectureId || '').trim()
    const videoKey = String(payload.videoKey || '').trim()

    if (!lectureId || !videoKey) {
      return sendJson(res, 400, {
        success: false,
        error: 'lectureId and videoKey are required',
      })
    }

    await updateLectureVideoKey(lectureId, videoKey)

    return sendJson(res, 200, {
      success: true,
      lectureId,
      videoKey,
    })
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      success: false,
      error: error.message || 'Lecture mapping failed',
    })
  }
}
