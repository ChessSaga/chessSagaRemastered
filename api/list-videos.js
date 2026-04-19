import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from './_lib/http.js'

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    await parseJsonBody(req)
    return sendJson(res, 410, {
      success: false,
      error: 'Endpoint deprecated. Use /api/get-lectures for Sanity-mapped lecture listing.',
    })
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: 'Unable to process request',
      details: error.message,
    })
  }
}
