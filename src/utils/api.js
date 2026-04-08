const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
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
