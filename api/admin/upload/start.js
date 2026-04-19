import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from '../../_lib/http.js'
import {verifyAdmin} from '../../../lib/auth.js'
import {workerPost} from '../../../lib/workerClient.js'

function normalizeId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    const admin = verifyAdmin(req)
    const payload = await parseJsonBody(req)

    const courseId = normalizeId(payload.courseId)
    const lectureId = normalizeId(payload.lectureId)
    const contentType = String(payload.contentType || '').trim().toLowerCase()

    if (!courseId || !lectureId) {
      return sendJson(res, 400, {success: false, error: 'courseId and lectureId are required'})
    }

    if (!contentType.startsWith('video/')) {
      return sendJson(res, 400, {success: false, error: 'Only video files are allowed'})
    }

    const key = `lectures/${courseId}/${lectureId}.mp4`

    const workerResponse = await workerPost('/multipart/start', {
      key,
      contentType,
      customMetadata: {
        courseId,
        lectureId,
        uploadedBy: admin.email,
      },
    })

    return sendJson(res, 200, {
      success: true,
      ...workerResponse,
      key,
    })
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      success: false,
      error: error.message || 'Unable to start upload',
    })
  }
}
