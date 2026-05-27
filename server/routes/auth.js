import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireAuth, signUserToken } from '../middleware/requireAuth.js'
import {
  EMAIL_RE,
  USERNAME_RE,
  normalizeEmail,
  normalizeUsername,
  validatePasswordRules,
} from '../auth/validators.js'

export const authRouter = Router()

function usersCol() {
  return getDB().collection('users')
}

function resetTokensCol() {
  return getDB().collection('passwordResetTokens')
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function frontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173'
}

/** Public: whether an email is already registered (for email-first login / signup flow). */
authRouter.post('/check-email', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' })
    }
    const found = await usersCol().findOne({ email }, { projection: { _id: 1 } })
    res.json({ registered: !!found })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

authRouter.post('/register', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username)
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3–32 characters (letters, numbers, underscore only).',
      })
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' })
    }
    const pwdErr = validatePasswordRules(password)
    if (pwdErr) return res.status(400).json({ error: pwdErr })

    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date()
    const doc = { username, email, passwordHash, createdAt: now }

    let insertedId
    try {
      const result = await usersCol().insertOne(doc)
      insertedId = result.insertedId
    } catch (err) {
      if (err.code === 11000) {
        const key = err.keyPattern ? Object.keys(err.keyPattern)[0] : ''
        if (key === 'email') return res.status(409).json({ error: 'That email is already registered.' })
        return res.status(409).json({ error: 'That username is already taken.' })
      }
      throw err
    }

    const token = signUserToken(insertedId, username)
    res.status(201).json({
      token,
      user: { id: String(insertedId), username, email },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const login = String(req.body.login ?? req.body.username ?? req.body.email ?? '').trim()
    const password = String(req.body.password || '')

    if (!login || !password) {
      return res.status(400).json({ error: 'Email or username and password are required.' })
    }

    const isEmail = login.includes('@')
    const user = isEmail
      ? await usersCol().findOne({ email: normalizeEmail(login) })
      : await usersCol().findOne({ username: normalizeUsername(login) })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email, username, or password.' })
    }
    if (!user.passwordHash) {
      return res.status(401).json({
        error: 'This account uses social sign-in. Please use Google or Meta (not email/password).',
      })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email, username, or password.' })
    }

    const token = signUserToken(user._id, user.username)
    res.json({
      token,
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email || null,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

authRouter.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' })
    }

    const user = await usersCol().findOne({ email })
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = hashResetToken(token)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 15 * 60 * 1000)

      await resetTokensCol().deleteMany({ userId: user._id })
      await resetTokensCol().insertOne({
        userId: user._id,
        tokenHash,
        createdAt: now,
        expiresAt,
        usedAt: null,
      })

      const resetUrl = `${frontendUrl()}/?resetToken=${encodeURIComponent(token)}`
      console.log('[Password reset link - dev only]', resetUrl)
    }

    res.json({
      ok: true,
      message: 'If that email exists, a reset link has been generated.',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

authRouter.post('/reset-password', async (req, res) => {
  try {
    const token = String(req.body.token || '').trim()
    const newPassword = String(req.body.newPassword || '')
    if (!token) return res.status(400).json({ error: 'Reset token is required.' })

    const pwdErr = validatePasswordRules(newPassword)
    if (pwdErr) return res.status(400).json({ error: pwdErr })

    const tokenHash = hashResetToken(token)
    const resetDoc = await resetTokensCol().findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })
    if (!resetDoc) {
      return res.status(400).json({ error: 'Reset link is invalid or expired.' })
    }

    const user = await usersCol().findOne({ _id: resetDoc.userId })
    if (!user) return res.status(400).json({ error: 'Reset link is invalid or expired.' })

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await usersCol().updateOne(
      { _id: user._id },
      { $set: { passwordHash, passwordUpdatedAt: new Date() } },
    )
    await resetTokensCol().updateOne(
      { _id: resetDoc._id },
      { $set: { usedAt: new Date() } },
    )

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await usersCol().findOne({ _id: new ObjectId(req.user.id) })
    if (!user) return res.status(401).json({ error: 'User not found.' })
    res.json({
      id: String(user._id),
      username: user.username,
      email: user.email || null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

authRouter.put('/profile', requireAuth, async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username)
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-32 characters (letters, numbers, underscore only).',
      })
    }

    const id = new ObjectId(req.user.id)
    const existing = await usersCol().findOne({ username, _id: { $ne: id } }, { projection: { _id: 1 } })
    if (existing) return res.status(409).json({ error: 'That username is already taken.' })

    const result = await usersCol().findOneAndUpdate(
      { _id: id },
      { $set: { username, updatedAt: new Date() } },
      { returnDocument: 'after' },
    )
    if (!result) return res.status(401).json({ error: 'User not found.' })

    const token = signUserToken(result._id, result.username)
    res.json({
      token,
      user: {
        id: String(result._id),
        username: result.username,
        email: result.email || null,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

authRouter.post('/change-password', requireAuth, async (req, res) => {
  try {
    const newPassword = String(req.body.newPassword || '')
    const pwdErr = validatePasswordRules(newPassword)
    if (pwdErr) return res.status(400).json({ error: pwdErr })

    const id = new ObjectId(req.user.id)
    const user = await usersCol().findOne({ _id: id })
    if (!user) return res.status(401).json({ error: 'User not found.' })

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await usersCol().updateOne(
      { _id: id },
      { $set: { passwordHash, passwordUpdatedAt: new Date() } },
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
