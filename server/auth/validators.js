export const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeUsername(name) {
  return String(name || '').trim().toLowerCase()
}

export function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase()
}

export function validatePasswordRules(password) {
  const p = String(password || '')
  if (p.length < 9) return 'Password must be at least 9 characters.'
  if (!/[a-z]/.test(p)) return 'Password must include a lowercase letter.'
  if (!/[A-Z]/.test(p)) return 'Password must include an uppercase letter.'
  if (!/[^A-Za-z0-9]/.test(p)) return 'Password must include a special character.'
  return null
}
