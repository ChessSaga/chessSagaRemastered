import {allowMethods, sendJson, setCorsHeaders} from '../../_lib/http.js'
import {verifyAdmin} from '../../../lib/auth.js'
import {workerPutStream} from '../../../lib/workerClient.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readBinaryBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body

  if (req.body instanceof Uint8Array) {
    return Buffer.from(req.body)
  }

  if (typeof req.body === 'string') {
    return Buffer.from(req.body)
  }

  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['PUT'])) return

  try {
    verifyAdmin(req)

    const key = String(req.query.key || '').trim()
    const uploadId = String(req.query.uploadId || '').trim()
    const partNumber = Number.parseInt(String(req.query.partNumber || ''), 10)

    if (!key || !uploadId || !Number.isFinite(partNumber) || partNumber <= 0) {
      return sendJson(res, 400, {
        success: false,
        error: 'key, uploadId and partNumber query params are required',
      })
    }

    const contentType = String(req.headers['content-type'] || 'application/octet-stream')
    const rawBody = await readBinaryBody(req)

    if (!rawBody.length) {
      return sendJson(res, 400, {success: false, error: 'Chunk body is required'})
    }

    const workerResponse = await workerPutStream(
      `/multipart/part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`,
      rawBody,
      contentType,
      rawBody.length
    )

    return sendJson(res, 200, {
      success: true,
      ...workerResponse,
    })
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      success: false,
      error: error.message || 'Unable to upload part',
    })
  }
}
