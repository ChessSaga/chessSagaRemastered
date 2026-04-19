import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from '../../_lib/http.js'
import {verifyAdmin} from '../../../lib/auth.js'
import {workerPost} from '../../../lib/workerClient.js'

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    verifyAdmin(req)
    const payload = await parseJsonBody(req)

    const key = String(payload.key || '').trim()
    const uploadId = String(payload.uploadId || '').trim()

    if (!key || !uploadId) {
      return sendJson(res, 400, {
        success: false,
        error: 'key and uploadId are required',
      })
    }

    const workerResponse = await workerPost('/multipart/abort', {
      key,
      uploadId,
    })

    return sendJson(res, 200, {
      success: true,
      ...workerResponse,
    })
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      success: false,
      error: error.message || 'Unable to abort upload',
    })
  }
}
