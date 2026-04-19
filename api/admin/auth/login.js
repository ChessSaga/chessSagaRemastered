import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from '../../_lib/http.js'
import {createAdminToken, validateAdminCredentials} from '../../../lib/auth.js'

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    const payload = await parseJsonBody(req)
    const email = String(payload.email || '').trim().toLowerCase()
    const password = String(payload.password || '')

    if (!email || !password) {
      return sendJson(res, 400, {success: false, error: 'Email and password are required'})
    }

    const valid = await validateAdminCredentials(email, password)
    if (!valid) {
      return sendJson(res, 401, {success: false, error: 'Invalid login credentials'})
    }

    const token = createAdminToken(email)

    return sendJson(res, 200, {
      success: true,
      token,
      admin: {email},
    })
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: error.message || 'Login failed',
    })
  }
}
