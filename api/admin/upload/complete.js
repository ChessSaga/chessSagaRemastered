import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from '../../_lib/http.js'
import {verifyAdmin} from '../../../lib/auth.js'
import {workerPost} from '../../../lib/workerClient.js'

function normalizeParts(parts) {
  return parts
    .map((part) => ({
      partNumber: Number.parseInt(String(part?.partNumber || ''), 10),
      etag: String(part?.etag || '').trim(),
    }))
    .filter((part) => Number.isFinite(part.partNumber) && part.partNumber > 0 && part.etag)
    .sort((a, b) => a.partNumber - b.partNumber)
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    verifyAdmin(req)
    const payload = await parseJsonBody(req)

    const key = String(payload.key || '').trim()
    const uploadId = String(payload.uploadId || '').trim()
    const parts = normalizeParts(Array.isArray(payload.parts) ? payload.parts : [])

    if (!key || !uploadId || parts.length === 0) {
      return sendJson(res, 400, {
        success: false,
        error: 'key, uploadId and parts are required',
      })
    }

    let workerResponse
    try {
      workerResponse = await workerPost('/multipart/complete', {
        key,
        uploadId,
        parts,
      })
    } catch (completeError) {
      // Prevent abandoned multipart sessions from cluttering R2.
      try {
        await workerPost('/multipart/abort', {key, uploadId})
      } catch {
        // Ignore abort failure, original error will be returned.
      }
      throw completeError
    }

    return sendJson(res, 200, {
      success: true,
      ...workerResponse,
    })
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      success: false,
      error: error.message || 'Unable to complete upload',
    })
  }
}
