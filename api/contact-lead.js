import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from './_lib/http.js'
import {sanityServerClient} from './_lib/sanity.js'

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 6
const requestCounters = new Map()

function normalizeText(value, max = 300) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function getRequesterIp(req) {
  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim()
  }

  return req.socket?.remoteAddress || 'unknown'
}

function isRateLimited(key) {
  const now = Date.now()
  const entry = requestCounters.get(key)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requestCounters.set(key, {windowStart: now, count: 1})
    return false
  }

  entry.count += 1
  requestCounters.set(key, entry)
  return entry.count > MAX_REQUESTS_PER_WINDOW
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    const requesterIp = getRequesterIp(req)
    if (isRateLimited(requesterIp)) {
      return sendJson(res, 429, {
        success: false,
        error: 'Too many requests. Please try again in a minute.',
      })
    }

    const payload = await parseJsonBody(req)
    const name = normalizeText(payload.name, 100)
    const email = normalizeText(payload.email, 140)
    const phone = normalizeText(payload.phone, 24)
    const message = normalizeText(payload.message, 1200)
    const childAgeRaw = payload.childAge
    const childAge = childAgeRaw === '' || childAgeRaw === null || childAgeRaw === undefined
      ? null
      : Number(childAgeRaw)

    if (!name || !email || !phone || !message) {
      return sendJson(res, 400, {
        success: false,
        error: 'name, email, phone and message are required',
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return sendJson(res, 400, {
        success: false,
        error: 'Please provide a valid email address',
      })
    }

    const phoneRegex = /^[+\d][\d\s-]{7,23}$/
    if (!phoneRegex.test(phone)) {
      return sendJson(res, 400, {
        success: false,
        error: 'Please provide a valid phone number',
      })
    }

    if (childAge !== null && Number.isNaN(childAge)) {
      return sendJson(res, 400, {
        success: false,
        error: 'childAge must be a valid number',
      })
    }

    const doc = await sanityServerClient.create({
      _type: 'contactLead',
      name,
      email,
      phone,
      childAge,
      message,
      source: 'website_contact_form',
      createdAt: new Date().toISOString(),
    })

    return sendJson(res, 200, {
      success: true,
      leadId: doc._id,
    })
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: 'Unable to submit contact form',
      details: error.message,
    })
  }
}