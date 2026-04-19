import axios from 'axios'
import {getAdminConfig} from './env.js'

let client
let normalizedWorkerBaseUrl

function buildError(message, statusCode = 500) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function unwrapAxiosError(error, fallbackMessage) {
  const statusCode = error?.response?.status || 500
  const responseData = error?.response?.data
  const workerError = String(responseData?.error || '').trim()
  const workerDetails = String(responseData?.details || '').trim()

  let message = error?.message || fallbackMessage

  if (workerError && workerDetails) {
    // Worker may return a generic error label plus an actionable details string.
    message = workerError === 'Worker request failed' ? workerDetails : `${workerError}: ${workerDetails}`
  } else if (workerError) {
    message = workerError
  } else if (workerDetails) {
    message = workerDetails
  }

  return buildError(message, statusCode)
}

function getWorkerBaseUrl() {
  if (normalizedWorkerBaseUrl) return normalizedWorkerBaseUrl

  const config = getAdminConfig()
  normalizedWorkerBaseUrl = config.workerApiBaseUrl.replace(/\/+$/, '')
  return normalizedWorkerBaseUrl
}

function buildWorkerUrl(path) {
  const base = getWorkerBaseUrl()
  const suffix = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`
  return `${base}${suffix}`
}

function getClient() {
  if (client) return client
  const config = getAdminConfig()

  client = axios.create({
    baseURL: getWorkerBaseUrl(),
    timeout: 120000,
    headers: {
      'X-Custom-Auth-Key': config.workerAuthKeySecret,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })

  return client
}

export async function workerGet(path, params = {}) {
  try {
    const {data} = await getClient().get(path, {params})
    return data
  } catch (error) {
    throw unwrapAxiosError(error, 'Worker GET request failed')
  }
}

export async function workerPost(path, body = {}) {
  try {
    const {data} = await getClient().post(path, body)
    return data
  } catch (error) {
    throw unwrapAxiosError(error, 'Worker POST request failed')
  }
}

export async function workerDelete(path) {
  try {
    const {data} = await getClient().delete(path)
    return data
  } catch (error) {
    throw unwrapAxiosError(error, 'Worker DELETE request failed')
  }
}

export async function workerPutStream(path, stream, contentType = 'application/octet-stream', contentLength) {
  const config = getAdminConfig()
  const headers = {'Content-Type': contentType}
  if (contentLength) headers['Content-Length'] = contentLength
  headers['X-Custom-Auth-Key'] = config.workerAuthKeySecret

  const requestInit = {
    method: 'PUT',
    headers,
    body: stream,
    redirect: 'manual',
  }

  // Node fetch requires duplex only when sending a live stream body.
  if (stream && typeof stream.pipe === 'function') {
    requestInit.duplex = 'half'
  }

  const response = await fetch(buildWorkerUrl(path), {
    ...requestInit,
  })

  const responseText = await response.text()
  let responseJson = null

  if (responseText) {
    try {
      responseJson = JSON.parse(responseText)
    } catch {
      responseJson = {success: false, error: responseText}
    }
  }

  if (!response.ok) {
    const message = responseJson?.error || `Worker upload part failed with status ${response.status}`
    throw buildError(message, response.status)
  }

  return responseJson || {success: true}
}
