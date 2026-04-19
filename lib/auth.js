import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {getAdminConfig} from './env.js'

const bcryptPrefix = /^\$2[aby]\$\d{2}\$/

function readBearerToken(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

export async function validateAdminCredentials(email, password) {
  const config = getAdminConfig()
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const rawPassword = String(password || '')

  if (!normalizedEmail || !rawPassword) return false
  if (normalizedEmail !== config.adminEmail) return false

  if (config.adminPasswordHash && bcryptPrefix.test(config.adminPasswordHash)) {
    return bcrypt.compare(rawPassword, config.adminPasswordHash)
  }

  return rawPassword === config.adminPassword
}

export function createAdminToken(email) {
  const config = getAdminConfig()
  return jwt.sign({email}, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}

export function verifyAdmin(req) {
  const config = getAdminConfig()
  const token = readBearerToken(req)

  if (!token) {
    const error = new Error('Missing Bearer token')
    error.statusCode = 401
    throw error
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    return {email: payload.email}
  } catch {
    const error = new Error('Invalid or expired token')
    error.statusCode = 401
    throw error
  }
}
