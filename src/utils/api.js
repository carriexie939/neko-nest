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
// get all transactions
export function fetchTransactions() {
  return request('/transactions')
}

// create a new transaction
// items is an array of transaction objects
// each transaction object has the following properties:
// - title: string
// - description: string
// - type: 'income' or 'expense'
// - category: string
// - amount: number
// - date: string
// - source: 'manual' or 'split'
// return the created transactions
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

// delete a transaction
// id is the id of the transaction to delete
// return the deleted transaction id
// if the transaction is not found, return null
export function deleteTransaction(id) {
  return request(`/transactions/${id}`, { method: 'DELETE' })
}

// get all settings
// return the settings object
// if the settings are not found, return null
export function fetchSettings() {
  return request('/settings')
}

// update the settings
// settings is an object with the following properties:
// - weeklyBudget: number
// return the updated settings object
// if the settings are not found, return null
export function updateSettings(settings) {
  return request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export function fetchMonthlyTrends() {
  return request('/transactions/monthly-trends')
}
