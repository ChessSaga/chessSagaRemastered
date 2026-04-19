import {allowMethods, sendJson, setCorsHeaders} from '../../_lib/http.js'
import {verifyAdmin} from '../../../lib/auth.js'
import {workerDelete, workerGet} from '../../../lib/workerClient.js'

function readKey(req) {
  const value = Array.isArray(req.query.key) ? req.query.key.join('/') : String(req.query.key || '')
  return decodeURIComponent(value).trim()
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['GET', 'DELETE'])) return

  try {
    verifyAdmin(req)

    const key = readKey(req)
    if (!key) {
      return sendJson(res, 400, {success: false, error: 'key is required'})
    }

    if (req.method === 'GET') {
      const workerResponse = await workerGet(`/objects/${encodeURIComponent(key)}`)
      return sendJson(res, 200, {success: true, ...workerResponse})
    }

    const workerResponse = await workerDelete(`/objects/${encodeURIComponent(key)}`)
    return sendJson(res, 200, {success: true, ...workerResponse})
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      success: false,
      error: error.message || 'Video operation failed',
    })
  }
}
