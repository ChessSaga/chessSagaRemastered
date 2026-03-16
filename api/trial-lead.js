import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from './_lib/http.js'
import {sanityServerClient} from './_lib/sanity.js'

function normalizeText(value, max = 300) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    const payload = await parseJsonBody(req)

    const name = normalizeText(payload.name, 100)
    const childAge = Number(payload.childAge)
    const whatsappNumber = normalizeText(payload.whatsappNumber, 20)
    const message = normalizeText(payload.message, 1000)
    const source = normalizeText(payload.source || 'whatsapp', 60)
    const utmCampaign = normalizeText(payload.utmCampaign, 120)
    const utmSource = normalizeText(payload.utmSource, 120)
    const utmMedium = normalizeText(payload.utmMedium, 120)

    if (!name || !whatsappNumber || Number.isNaN(childAge)) {
      return sendJson(res, 400, {
        success: false,
        error: 'name, childAge and whatsappNumber are required',
      })
    }

    const doc = await sanityServerClient.create({
      _type: 'trialLead',
      name,
      childAge,
      whatsappNumber,
      message,
      source,
      utmCampaign,
      utmSource,
      utmMedium,
      createdAt: new Date().toISOString(),
    })

    return sendJson(res, 200, {
      success: true,
      leadId: doc._id,
    })
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: 'Unable to create trial lead',
      details: error.message,
    })
  }
}
