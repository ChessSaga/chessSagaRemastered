export function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body)
}

export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true

  res.setHeader('Allow', methods)
  sendJson(res, 405, {
    success: false,
    error: `Method ${req.method} not allowed`,
  })
  return false
}

export async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    return JSON.parse(req.body)
  }

  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf-8').trim()
  if (!raw) return {}
  return JSON.parse(raw)
}

export function setCorsHeaders(req, res) {
  const allowedOrigin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }

  return false
}
