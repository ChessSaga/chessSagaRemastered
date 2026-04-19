const ADMIN_TOKEN_KEY = 'chessSagaAdminToken'
const ADMIN_EMAIL_KEY = 'chessSagaAdminEmail'

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''
}

export function setAdminSession(token, email) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  sessionStorage.setItem(ADMIN_EMAIL_KEY, email)
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  sessionStorage.removeItem(ADMIN_EMAIL_KEY)
}

export function getAdminEmail() {
  return sessionStorage.getItem(ADMIN_EMAIL_KEY) || ''
}
