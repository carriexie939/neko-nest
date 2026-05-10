import jwt from 'jsonwebtoken'

export function jwtSecret() {
  const s = process.env.JWT_SECRET
  if (!s) {
    console.warn('JWT_SECRET is not set; using insecure dev default. Set JWT_SECRET in production.')
    return 'neko-nest-dev-insecure-secret'
  }
  return s
}

export function signUserToken(userId, username) {
  return jwt.sign({ u: username }, jwtSecret(), {
    subject: String(userId),
    expiresIn: '7d',
  })
}

export function requireAuth(req, res, next) {
  const raw = req.headers.authorization
  if (!raw || !raw.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const payload = jwt.verify(raw.slice('Bearer '.length).trim(), jwtSecret())
    req.user = { id: payload.sub, username: payload.u }
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
