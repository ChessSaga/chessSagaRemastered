function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  })
}

function baseCorsHeaders(env, request) {
  const allowedOrigin = env.ALLOWED_ORIGIN || '*'
  const origin = request.headers.get('Origin') || '*'
  const isWildcard = allowedOrigin === '*'
  const allowOrigin = isWildcard ? '*' : allowedOrigin === origin ? origin : 'null'

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-custom-auth-key',
  }
}

function normalizeObjectKey(input) {
  return String(input || '')
    .trim()
    .replace(/^\/+/, '')
}

function hasValidAuth(request, env) {
  const candidate = request.headers.get('x-custom-auth-key') || ''
  return Boolean(env.AUTH_KEY_SECRET && candidate && candidate === env.AUTH_KEY_SECRET)
}

async function parseJson(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function getPathAfterPrefix(pathname, prefix) {
  const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  if (!normalized.startsWith(prefix)) return ''
  return decodeURIComponent(normalized.slice(prefix.length).replace(/^\/+/, ''))
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function handleSinglePut(request, env, key, corsHeaders) {
  const objectKey = normalizeObjectKey(key)
  if (!objectKey) {
    return jsonResponse({success: false, error: 'Object key is required'}, 400, corsHeaders)
  }

  await env.LECTURE_VIDEOS.put(objectKey, request.body, {
    httpMetadata: {
      contentType: request.headers.get('content-type') || 'application/octet-stream',
    },
    customMetadata: {
      uploadedVia: 'lecture-video-manager-worker',
      uploadedAt: new Date().toISOString(),
    },
  })

  return jsonResponse({success: true, key: objectKey}, 200, corsHeaders)
}

async function handleStartMultipart(request, env, corsHeaders) {
  const body = await parseJson(request)
  const key = normalizeObjectKey(body.key)

  if (!key) {
    return jsonResponse({success: false, error: 'key is required'}, 400, corsHeaders)
  }

  const customMetadata = body.customMetadata && typeof body.customMetadata === 'object' ? body.customMetadata : {}
  const httpMetadata = body.httpMetadata && typeof body.httpMetadata === 'object' ? body.httpMetadata : {}

  if (!httpMetadata.contentType && body.contentType) {
    httpMetadata.contentType = String(body.contentType)
  }

  const multipartUpload = await env.LECTURE_VIDEOS.createMultipartUpload(key, {
    httpMetadata,
    customMetadata,
  })

  return jsonResponse(
    {
      success: true,
      key,
      uploadId: multipartUpload.uploadId,
    },
    200,
    corsHeaders
  )
}

async function handleUploadPart(request, env, corsHeaders) {
  const url = new URL(request.url)
  const key = normalizeObjectKey(url.searchParams.get('key'))
  const uploadId = String(url.searchParams.get('uploadId') || '').trim()
  const partNumber = parsePositiveInt(url.searchParams.get('partNumber'), 0)

  if (!key || !uploadId || !partNumber) {
    return jsonResponse(
      {success: false, error: 'key, uploadId and partNumber are required query params'},
      400,
      corsHeaders
    )
  }

  const multipart = env.LECTURE_VIDEOS.resumeMultipartUpload(key, uploadId)
  const uploadedPart = await multipart.uploadPart(partNumber, request.body)

  return jsonResponse(
    {
      success: true,
      key,
      uploadId,
      partNumber,
      etag: uploadedPart.etag,
    },
    200,
    corsHeaders
  )
}

async function handleCompleteMultipart(request, env, corsHeaders) {
  const body = await parseJson(request)
  const key = normalizeObjectKey(body.key)
  const uploadId = String(body.uploadId || '').trim()
  const parts = Array.isArray(body.parts) ? body.parts : []

  if (!key || !uploadId || parts.length === 0) {
    return jsonResponse(
      {success: false, error: 'key, uploadId and parts[] are required'},
      400,
      corsHeaders
    )
  }

  const normalizedParts = parts
    .map((part) => ({
      partNumber: parsePositiveInt(part.partNumber, 0),
      etag: String(part.etag || '').trim(),
    }))
    .filter((part) => part.partNumber > 0 && part.etag)
    .sort((a, b) => a.partNumber - b.partNumber)

  if (normalizedParts.length === 0) {
    return jsonResponse({success: false, error: 'No valid parts were provided'}, 400, corsHeaders)
  }

  const multipart = env.LECTURE_VIDEOS.resumeMultipartUpload(key, uploadId)
  const completedObject = await multipart.complete(normalizedParts)

  return jsonResponse(
    {
      success: true,
      key,
      uploadId,
      etag: completedObject.etag,
      version: completedObject.version,
      size: completedObject.size,
      uploaded: completedObject.uploaded,
    },
    200,
    corsHeaders
  )
}

async function handleAbortMultipart(request, env, corsHeaders) {
  const body = await parseJson(request)
  const key = normalizeObjectKey(body.key)
  const uploadId = String(body.uploadId || '').trim()

  if (!key || !uploadId) {
    return jsonResponse({success: false, error: 'key and uploadId are required'}, 400, corsHeaders)
  }

  const multipart = env.LECTURE_VIDEOS.resumeMultipartUpload(key, uploadId)
  await multipart.abort()

  return jsonResponse({success: true, key, uploadId}, 200, corsHeaders)
}

async function handleListObjects(request, env, corsHeaders) {
  const url = new URL(request.url)
  const prefix = normalizeObjectKey(url.searchParams.get('prefix'))
  const cursor = String(url.searchParams.get('cursor') || '').trim() || undefined
  const limit = parsePositiveInt(url.searchParams.get('limit'), 100)

  const result = await env.LECTURE_VIDEOS.list({
    prefix: prefix || undefined,
    cursor,
    limit: Math.min(limit, 1000),
  })

  return jsonResponse(
    {
      success: true,
      prefix,
      cursor: result.cursor || '',
      truncated: Boolean(result.truncated),
      objects: (result.objects || []).map((obj) => ({
        key: obj.key,
        size: obj.size,
        etag: obj.etag,
        uploaded: obj.uploaded,
        version: obj.version,
        checksums: obj.checksums,
      })),
    },
    200,
    corsHeaders
  )
}

async function handleHeadObject(env, key, corsHeaders) {
  const objectKey = normalizeObjectKey(key)
  if (!objectKey) {
    return jsonResponse({success: false, error: 'Object key is required'}, 400, corsHeaders)
  }

  const object = await env.LECTURE_VIDEOS.head(objectKey)
  if (!object) {
    return jsonResponse({success: false, error: 'Object not found'}, 404, corsHeaders)
  }

  return jsonResponse(
    {
      success: true,
      object: {
        key: object.key,
        size: object.size,
        etag: object.etag,
        uploaded: object.uploaded,
        version: object.version,
        httpEtag: object.httpEtag,
        checksums: object.checksums,
        customMetadata: object.customMetadata,
        httpMetadata: object.httpMetadata,
      },
    },
    200,
    corsHeaders
  )
}

async function handleDeleteObject(env, key, corsHeaders) {
  const objectKey = normalizeObjectKey(key)
  if (!objectKey) {
    return jsonResponse({success: false, error: 'Object key is required'}, 400, corsHeaders)
  }

  await env.LECTURE_VIDEOS.delete(objectKey)
  return jsonResponse({success: true, key: objectKey}, 200, corsHeaders)
}

export default {
  async fetch(request, env) {
    const corsHeaders = baseCorsHeaders(env, request)

    if (request.method === 'OPTIONS') {
      return new Response(null, {status: 204, headers: corsHeaders})
    }

    const url = new URL(request.url)
    const pathname = url.pathname

    if (pathname === '/health' && request.method === 'GET') {
      return jsonResponse({success: true, service: 'lecture-video-manager'}, 200, corsHeaders)
    }

    if (!hasValidAuth(request, env)) {
      return jsonResponse({success: false, error: 'Forbidden'}, 403, corsHeaders)
    }

    try {
      if (pathname === '/multipart/start' && request.method === 'POST') {
        return await handleStartMultipart(request, env, corsHeaders)
      }

      if (pathname === '/multipart/part' && request.method === 'PUT') {
        return await handleUploadPart(request, env, corsHeaders)
      }

      if (pathname === '/multipart/complete' && request.method === 'POST') {
        return await handleCompleteMultipart(request, env, corsHeaders)
      }

      if (pathname === '/multipart/abort' && request.method === 'POST') {
        return await handleAbortMultipart(request, env, corsHeaders)
      }

      if (pathname === '/objects' && request.method === 'GET') {
        return await handleListObjects(request, env, corsHeaders)
      }

      if (pathname.startsWith('/objects/')) {
        const key = getPathAfterPrefix(pathname, '/objects/')

        if (request.method === 'HEAD' || request.method === 'GET') {
          return await handleHeadObject(env, key, corsHeaders)
        }

        if (request.method === 'PUT') {
          return await handleSinglePut(request, env, key, corsHeaders)
        }

        if (request.method === 'DELETE') {
          return await handleDeleteObject(env, key, corsHeaders)
        }
      }

      return jsonResponse({success: false, error: 'Not found'}, 404, corsHeaders)
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          error: 'Worker request failed',
          details: error?.message || 'Unknown error',
        },
        500,
        corsHeaders
      )
    }
  },
}
