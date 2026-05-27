import { clearSession, getToken } from './authStorage'

const BASE = '/api'

let onAuthExpired = () => {}

export function setAuthExpiredHandler(fn) {
  onAuthExpired = typeof fn === 'function' ? fn : () => {}
}

function authHeaders() {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function request(path, options = {}) {
  const { auth: useAuth = true, ...fetchOptions } = options
  const res = await fetch(`${BASE}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(useAuth ? authHeaders() : {}),
      ...fetchOptions.headers,
    },
  })
  if (res.status === 401 && useAuth) {
    clearSession()
    onAuthExpired()
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function fetchMe() {
  return request('/auth/me')
}

export function updateProfile(fields) {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(fields),
  })
}

export function changePassword({ newPassword }) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  })
}

export function requestPasswordReset(email) {
  return request('/auth/forgot-password', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword({ token, newPassword }) {
  return request('/auth/reset-password', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  })
}

export function checkEmailRegistered(email) {
  return request('/auth/check-email', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function registerAccount({ username, email, password }) {
  return request('/auth/register', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export function loginAccount(login, password) {
  return request('/auth/login', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ login, password }),
  })
}

export function oauthGoogle(idToken) {
  return request('/auth/oauth/google', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })
}

export function parseReceipt(imageDataUrl) {
  return request('/receipts/parse', {
    method: 'POST',
    body: JSON.stringify({ imageDataUrl }),
  })
}

export function fetchTransactions() {
  return request('/transactions')
}

export function createTransactions(items) {
  return request('/transactions', {
    method: 'POST',
    body: JSON.stringify(Array.isArray(items) ? items : [items]),
  })
}

export function updateTransaction(id, fields) {
  return request(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  })
}

export function deleteTransaction(id) {
  return request(`/transactions/${id}`, { method: 'DELETE' })
}

export function fetchSettings() {
  return request('/settings')
}

export function updateSettings(settings) {
  return request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export function fetchMonthlyTrends() {
  return request('/transactions/monthly-trends')
}
