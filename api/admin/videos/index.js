import {allowMethods, sendJson, setCorsHeaders} from '../../_lib/http.js'
import {verifyAdmin} from '../../../lib/auth.js'
import {workerGet} from '../../../lib/workerClient.js'

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['GET'])) return

  try {
    verifyAdmin(req)

    const prefix = String(req.query.prefix || 'lectures/').trim()
    const cursor = String(req.query.cursor || '').trim()
    const limit = Number.parseInt(String(req.query.limit || '100'), 10)

    const workerResponse = await workerGet('/objects', {
      prefix,
      cursor: cursor || undefined,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 1000) : 100,
    })

    return sendJson(res, 200, {
      success: true,
      ...workerResponse,
    })
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      success: false,
      error: error.message || 'Unable to list videos',
    })
  }
}
