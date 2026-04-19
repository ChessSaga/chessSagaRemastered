import axios from 'axios'
import {getAdminToken} from './authStore'

const normalizedBaseUrl = import.meta.env.VITE_ADMIN_API_BASE_URL || '/api/admin'

const adminApi = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 120000,
})

adminApi.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default adminApi
