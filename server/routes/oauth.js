import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { getDB } from '../db.js'
import { jwtSecret, signUserToken } from '../middleware/requireAuth.js'
import { normalizeEmail, normalizeUsername } from '../auth/validators.js'

export const oauthRouter = Router()

function usersCol() {
  return getDB().collection('users')
}

function frontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173'
}

function signOAuthState(provider) {
  return jwt.sign({ provider, t: Date.now() }, jwtSecret(), { expiresIn: '10m' })
}

function redirectWithToken(res, token) {
  res.redirect(`${frontendUrl()}#oauth=${encodeURIComponent(token)}`)
}

async function upsertOAuthUser({ email, usernameHint, provider, providerId }) {
  const emailNorm = normalizeEmail(email)
  if (!emailNorm) throw new Error('Email is required from the provider.')

  let user = await usersCol().findOne({
    $or: [{ email: emailNorm }, { [`oauth.${provider}`]: providerId }],
  })

  if (!user) {
    let base = String(usernameHint || emailNorm.split('@')[0] || 'user')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .slice(0, 24) || 'user'
    base = normalizeUsername(base)
    if (!base || base.length < 3) base = 'user'
    let username = base
    let n = 0
    while (await usersCol().findOne({ username })) {
      n += 1
      username = `${base.slice(0, 20)}_${n}`
    }
    const doc = {
      username,
      email: emailNorm,
      createdAt: new Date(),
      oauth: { [provider]: providerId },
    }
    const result = await usersCol().insertOne(doc)
    user = await usersCol().findOne({ _id: result.insertedId })
  } else {
    const set = { [`oauth.${provider}`]: providerId }
    if (!user.email) set.email = emailNorm
    await usersCol().updateOne({ _id: user._id }, { $set: set })
    user = await usersCol().findOne({ _id: user._id })
  }

  return user
}

oauthRouter.post('/google', async (req, res) => {
  try {
    const idToken = String(req.body.idToken || '')
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return res.status(503).json({ error: 'Google sign-in is not configured (set GOOGLE_CLIENT_ID).' })
    }
    if (!idToken) return res.status(400).json({ error: 'Missing idToken.' })

    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({ idToken, audience: clientId })
    const p = ticket.getPayload()
    const email = p.email
    const sub = p.sub
    if (!email) return res.status(400).json({ error: 'Google did not return an email for this account.' })

    const user = await upsertOAuthUser({
      email,
      usernameHint: p.name || email.split('@')[0],
      provider: 'google',
      providerId: sub,
    })
    const token = signUserToken(user._id, user.username)
    res.json({
      token,
      user: { id: String(user._id), username: user.username, email: user.email },
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Google sign-in failed.' })
  }
})

oauthRouter.get('/microsoft/start', (req, res) => {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_REDIRECT_URI) {
    return res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent('Microsoft sign-in is not configured on the server.')}`)
  }
  const state = signOAuthState('microsoft')
  const u = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
  u.searchParams.set('client_id', process.env.MICROSOFT_CLIENT_ID)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('redirect_uri', process.env.MICROSOFT_REDIRECT_URI)
  u.searchParams.set('response_mode', 'query')
  u.searchParams.set('scope', 'openid profile email User.Read')
  u.searchParams.set('state', state)
  res.redirect(u.toString())
})

async function exchangeMicrosoftCode(code) {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    code,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    grant_type: 'authorization_code',
  })
  const r = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await r.json()
  if (data.error) throw new Error(data.error_description || data.error)
  return data.access_token
}

async function fetchMicrosoftProfile(accessToken) {
  const r = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await r.json()
  if (data.error) throw new Error(data.error.message || 'Microsoft Graph error')
  const email = data.mail || data.userPrincipalName
  return { id: data.id, email, name: data.displayName }
}

oauthRouter.get('/microsoft/callback', async (req, res) => {
  try {
    const { code, state, error, error_description: errDesc } = req.query
    if (error) {
      return res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent(String(errDesc || error))}`)
    }
    jwt.verify(String(state || ''), jwtSecret())
    if (!code) {
      return res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent('Missing authorization code.')}`)
    }
    const accessToken = await exchangeMicrosoftCode(String(code))
    const profile = await fetchMicrosoftProfile(accessToken)
    if (!profile.email || !String(profile.email).includes('@')) {
      return res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent('Microsoft did not return a usable email.')}`)
    }
    const user = await upsertOAuthUser({
      email: profile.email,
      usernameHint: profile.name,
      provider: 'microsoft',
      providerId: profile.id,
    })
    const token = signUserToken(user._id, user.username)
    redirectWithToken(res, token)
  } catch (err) {
    res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent(err.message || 'Microsoft sign-in failed.')}`)
  }
})

/** Instagram consumer login uses Meta / Facebook OAuth. */
oauthRouter.get('/instagram/start', (req, res) => {
  res.redirect('/api/auth/oauth/facebook/start')
})

oauthRouter.get('/facebook/start', (req, res) => {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_REDIRECT_URI) {
    return res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent('Facebook / Meta sign-in is not configured on the server.')}`)
  }
  const state = signOAuthState('facebook')
  const u = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  u.searchParams.set('client_id', process.env.FACEBOOK_APP_ID)
  u.searchParams.set('redirect_uri', process.env.FACEBOOK_REDIRECT_URI)
  u.searchParams.set('state', state)
  u.searchParams.set('scope', 'email,public_profile')
  res.redirect(u.toString())
})

async function exchangeFacebookCode(code) {
  const u = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  u.searchParams.set('client_id', process.env.FACEBOOK_APP_ID)
  u.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET)
  u.searchParams.set('code', code)
  u.searchParams.set('redirect_uri', process.env.FACEBOOK_REDIRECT_URI)
  const r = await fetch(u.toString())
  const data = await r.json()
  if (data.error) throw new Error(data.error.message || 'Facebook token error')
  return data.access_token
}

async function fetchFacebookProfile(accessToken) {
  const u = new URL('https://graph.facebook.com/me')
  u.searchParams.set('fields', 'id,email,name')
  u.searchParams.set('access_token', accessToken)
  const r = await fetch(u.toString())
  const data = await r.json()
  if (data.error) throw new Error(data.error.message || 'Facebook profile error')
  return data
}

oauthRouter.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state, error, error_description: errDesc } = req.query
    if (error) {
      return res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent(String(errDesc || error))}`)
    }
    jwt.verify(String(state || ''), jwtSecret())
    if (!code) {
      return res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent('Missing authorization code.')}`)
    }
    const accessToken = await exchangeFacebookCode(String(code))
    const profile = await fetchFacebookProfile(accessToken)
    if (!profile.email) {
      return res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent('Facebook did not share an email. Please allow email permission.')}`)
    }
    const user = await upsertOAuthUser({
      email: profile.email,
      usernameHint: profile.name,
      provider: 'facebook',
      providerId: String(profile.id),
    })
    const token = signUserToken(user._id, user.username)
    redirectWithToken(res, token)
  } catch (err) {
    res.redirect(`${frontendUrl()}#oauth_error=${encodeURIComponent(err.message || 'Facebook sign-in failed.')}`)
  }
})
