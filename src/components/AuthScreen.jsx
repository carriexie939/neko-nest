import { useEffect, useRef, useState } from 'react'
import { tokens } from '../theme/tokens'
import * as api from '../utils/api'
import { setSession } from '../utils/authStorage'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const { color: c, radius, shadow } = tokens
const pill = 9999

function validatePasswordClient(password) {
  const p = String(password || '')
  if (p.length < 9) return 'At least 9 characters'
  if (!/[a-z]/.test(p)) return 'One lowercase letter'
  if (!/[A-Z]/.test(p)) return 'One uppercase letter'
  if (!/[^A-Za-z0-9]/.test(p)) return 'One special character'
  return null
}

/** Multicolor “G” sized to match `IconMeta` (22×22). */
function IconGoogleG() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.432 32.924 29.016 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.016 0-9.417-3.076-11.234-7.438l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-2.585 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

/** Meta (Facebook Login) icon — 22×22, matches Google row. */
function IconMeta() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#0866FF" />
      <path
        fill="#fff"
        d="M13.5 12.5h2.2l0.9-2.9h-2.2V8.1c0-.8.3-1.4 1.5-1.4h1.2V4.1c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v1.9H9.2v2.9h2.4V19h2.9v-6.5z"
      />
    </svg>
  )
}

const WELCOME_PAWS_URL = '/auth-welcome-paws.png'
const fontHandwritten = "'Caveat', 'Segoe Print', 'Bradley Hand', cursive"
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

let googleIdentityScriptPromise

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Google sign-in failed to load.'))
    document.head.appendChild(script)
  })

  return googleIdentityScriptPromise
}

/** Paw strip + “Welcome back” anchored between art and body copy. */
function WelcomeHero() {
  const pad = tokens.spacing.lg
  return (
    <div
      style={{
        marginTop: -pad,
        marginLeft: -pad,
        marginRight: -pad,
        width: `calc(100% + ${pad * 2}px)`,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        position: 'relative',
        minHeight: 168,
        backgroundColor: '#ffffff',
        backgroundImage: `url(${WELCOME_PAWS_URL})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        overflow: 'visible',
      }}
    >
      <h1
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 2,
          margin: 0,
          padding: 0,
          fontSize: 44,
          fontWeight: 700,
          lineHeight: 1.05,
          textAlign: 'center',
          color: '#3b82f6',
          fontFamily: fontHandwritten,
          transform: 'translateY(52%)',
          pointerEvents: 'none',
        }}
      >
        Welcome back
      </h1>
    </div>
  )
}

export function AuthScreen({ onAuthenticated, flashError, onClearFlash }) {
  const [screen, setScreen] = useState('welcome')
  const [emailDraft, setEmailDraft] = useState('')
  const [flowEmail, setFlowEmail] = useState('')
  const [password, setPassword] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const googleFallbackTimer = useRef(null)

  const card = {
    background: c.panel,
    borderRadius: radius.lg,
    border: `1px solid ${c.border}`,
    boxShadow: shadow.soft,
    padding: tokens.spacing.lg,
  }

  const pillInput = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 20px',
    borderRadius: pill,
    border: `1.5px solid ${c.border}`,
    background: c.panel,
    color: c.text,
    fontSize: 16,
    outline: 'none',
  }

  const label = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
    color: c.subtext,
    letterSpacing: '0.02em',
  }

  const primaryBtn = {
    width: '100%',
    padding: '15px 20px',
    borderRadius: pill,
    border: 'none',
    background: c.accentStrong,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: shadow.soft,
  }

  /** Email step primary action — blue (aligned with `.btn-action` in global CSS). */
  const continueBtn = {
    ...primaryBtn,
    background: '#3b82f6',
  }

  /** Visually aligned with Google / Meta outline pills. */
  const gsiOutlineCompanion = {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: pill,
    border: '1px solid #dadce0',
    background: '#fff',
    color: '#1f1f1f',
    minHeight: 44,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'inherit',
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('resetToken')
    if (!token) return
    setResetToken(token)
    setScreen('reset-password')
    setError('')
    setNotice('')
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  useEffect(() => {
    if (flashError) {
      setError(flashError)
      onClearFlash?.()
    }
  }, [flashError, onClearFlash])

  useEffect(() => {
    return () => {
      if (googleFallbackTimer.current) window.clearTimeout(googleFallbackTimer.current)
    }
  }, [])

  function startOAuth(path) {
    setError('')
    setBusy(true)
    window.location.href = `/api/auth/oauth${path}`
  }

  async function completeGoogleSignIn(response) {
    if (googleFallbackTimer.current) {
      window.clearTimeout(googleFallbackTimer.current)
      googleFallbackTimer.current = null
    }

    if (!response?.credential) {
      setBusy(false)
      setError('Google did not return a sign-in token.')
      return
    }

    try {
      const { token, user } = await api.oauthGoogle(response.credential)
      setSession(token, user)
      onAuthenticated(user)
    } catch (err) {
      setError(err.message || 'Google sign-in failed.')
      setBusy(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')

    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured.')
      return
    }

    setBusy(true)
    try {
      await loadGoogleIdentityScript()
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: completeGoogleSignIn,
        use_fedcm_for_prompt: true,
      })
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          startOAuth('/google/start')
        }
      })

      googleFallbackTimer.current = window.setTimeout(() => {
        setBusy(false)
      }, 2500)
    } catch {
      setBusy(false)
      startOAuth('/google/start')
    }
  }

  function goWelcome() {
    setScreen('welcome')
    setError('')
    setPassword('')
    setRegUsername('')
    setRegPassword('')
    setResetEmail('')
    setResetToken('')
    setResetPassword('')
    setResetPasswordConfirm('')
    setFlowEmail('')
    setNotice('')
  }

  async function handleContinueEmail(e) {
    e.preventDefault()
    setError('')
    const em = emailDraft.trim().toLowerCase()
    if (!EMAIL_RE.test(em)) {
      setError('Please enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      const { registered } = await api.checkEmailRegistered(em)
      setFlowEmail(em)
      setPassword('')
      if (registered) {
        setScreen('login-password')
      } else {
        setRegUsername('')
        setRegPassword('')
        setScreen('register-setup')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { token, user } = await api.loginAccount(flowEmail, password)
      setSession(token, user)
      onAuthenticated(user)
    } catch (err) {
      setError(err.message || 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault()
    setError('')
    const u = regUsername.trim().toLowerCase()
    const em = flowEmail
    if (!USERNAME_RE.test(u)) {
      setError('Username: 3–32 characters, letters, numbers, or underscore only.')
      return
    }
    const pwdErr = validatePasswordClient(regPassword)
    if (pwdErr) {
      setError(`Password must include: ${pwdErr}.`)
      return
    }
    setBusy(true)
    try {
      const { token, user } = await api.registerAccount({
        username: u,
        email: em,
        password: regPassword,
      })
      setSession(token, user)
      onAuthenticated(user)
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPasswordSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const em = resetEmail.trim().toLowerCase()
    if (!EMAIL_RE.test(em)) {
      setError('Please enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      await api.requestPasswordReset(em)
      setNotice('If that email exists, a reset link has been generated. In local dev, check the backend terminal.')
    } catch (err) {
      setError(err.message || 'Could not start password reset.')
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const pwdErr = validatePasswordClient(resetPassword)
    if (pwdErr) {
      setError(`Password must include: ${pwdErr}.`)
      return
    }
    if (resetPassword !== resetPasswordConfirm) {
      setError('New passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await api.resetPassword({ token: resetToken, newPassword: resetPassword })
      setResetToken('')
      setResetPassword('')
      setResetPasswordConfirm('')
      setPassword('')
      setScreen('welcome')
      setNotice('Password updated. Please sign in with your new password.')
    } catch (err) {
      setError(err.message || 'Could not reset password.')
    } finally {
      setBusy(false)
    }
  }

  const divider = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
      <div style={{ flex: 1, height: 1, background: c.border }} />
      <span style={{ fontSize: 13, color: c.subtext, fontWeight: 500 }}>or</span>
      <div style={{ flex: 1, height: 1, background: c.border }} />
    </div>
  )

  const legal = (
    <p
      style={{
        margin: '28px 0 0',
        fontSize: 11,
        lineHeight: 1.55,
        color: c.subtext,
        textAlign: 'center',
      }}
    >
      By continuing, you agree to Pocket Cookie&apos;s{' '}
      <a href="#" style={{ color: c.warm, textDecoration: 'underline' }}>
        Terms of Service
      </a>{' '}
      and{' '}
      <a href="#" style={{ color: c.warm, textDecoration: 'underline' }}>
        Privacy Policy
      </a>
      .
    </p>
  )

  const backBtn = (
    <button
      type="button"
      onClick={goWelcome}
      style={{
        border: 'none',
        background: 'none',
        color: c.accentStrong,
        fontWeight: 600,
        cursor: 'pointer',
        padding: '0 0 16px',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      ← Back
    </button>
  )

  if (screen === 'welcome') {
    return (
      <div className="auth-screen" style={{ ...card, position: 'relative', zIndex: 0 }}>
        <WelcomeHero />
        <p
          style={{
            margin: '34px 0 28px',
            fontSize: 14,
            color: c.subtext,
            textAlign: 'center',
            lineHeight: 1.45,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Sign in to Pocket Cookie
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
            aria-label="Continue with Google"
            style={{
              ...gsiOutlineCompanion,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '10px 16px',
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            <span style={{ flexShrink: 0, display: 'grid', placeItems: 'center' }}>
              <IconGoogleG />
            </span>
            {busy ? 'Opening Google…' : 'Continue with Google'}
          </button>

          <button
            type="button"
            onClick={() => startOAuth('/meta/start')}
            disabled={busy}
            aria-label="Continue with Meta"
            style={{
              ...gsiOutlineCompanion,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '10px 16px',
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            <span style={{ flexShrink: 0, display: 'grid', placeItems: 'center' }}>
              <IconMeta />
            </span>
            {busy ? 'Opening Meta…' : 'Continue with Meta'}
          </button>
        </div>

        {divider}

        <form onSubmit={handleContinueEmail}>
          <label style={label} htmlFor="auth-email-step">
            Email
          </label>
          <input
            id="auth-email-step"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter email address"
            value={emailDraft}
            onChange={(ev) => setEmailDraft(ev.target.value)}
            style={{ ...pillInput, marginBottom: 16 }}
          />
          <button
            type="submit"
            disabled={busy}
            style={{
              ...continueBtn,
              opacity: busy ? 0.85 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {busy ? 'Please wait…' : 'Continue'}
          </button>
        </form>

        {notice ? (
          <p style={{ margin: '16px 0 0', fontSize: 13, color: '#047857', textAlign: 'center', fontWeight: 700 }}>{notice}</p>
        ) : null}

        {error ? (
          <p style={{ margin: '16px 0 0', fontSize: 13, color: c.danger, textAlign: 'center' }}>{error}</p>
        ) : null}

        {legal}
      </div>
    )
  }

  if (screen === 'login-password') {
    return (
      <div className="auth-screen" style={card}>
        {backBtn}
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: c.text,
          }}
        >
          Sign in
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: c.subtext, lineHeight: 1.45 }}>
          Enter your password for <strong style={{ color: c.text }}>{flowEmail}</strong>
        </p>

        <form onSubmit={handleLoginSubmit}>
          <label style={label} htmlFor="login-pass">
            Password
          </label>
          <input
            id="login-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            style={{ ...pillInput, marginBottom: 20 }}
          />
          {error ? (
            <p style={{ margin: '0 0 14px', fontSize: 13, color: c.danger }}>{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            style={{
              ...primaryBtn,
              opacity: busy ? 0.85 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {busy ? 'Please wait…' : 'Log in'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setResetEmail(flowEmail)
            setScreen('forgot-password')
            setError('')
            setNotice('')
          }}
          style={{
            border: 0,
            background: 'transparent',
            color: c.accentStrong,
            cursor: 'pointer',
            display: 'block',
            fontSize: 13,
            fontWeight: 700,
            margin: '14px auto 0',
            padding: 4,
          }}
        >
          Forgot password?
        </button>
      </div>
    )
  }

  if (screen === 'forgot-password') {
    return (
      <div className="auth-screen" style={card}>
        {backBtn}
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: c.text,
          }}
        >
          Reset password
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: c.subtext, lineHeight: 1.45 }}>
          Enter your account email. We will generate a secure reset link.
        </p>

        <form onSubmit={handleForgotPasswordSubmit}>
          <label style={label} htmlFor="reset-email">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="Enter email address"
            value={resetEmail}
            onChange={(ev) => {
              setResetEmail(ev.target.value)
              setError('')
              setNotice('')
            }}
            style={{ ...pillInput, marginBottom: 16 }}
          />
          {notice ? (
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#047857', fontWeight: 700 }}>{notice}</p>
          ) : null}
          {error ? (
            <p style={{ margin: '0 0 14px', fontSize: 13, color: c.danger }}>{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            style={{
              ...primaryBtn,
              opacity: busy ? 0.85 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {busy ? 'Please wait…' : 'Send reset link'}
          </button>
        </form>
      </div>
    )
  }

  if (screen === 'reset-password') {
    return (
      <div className="auth-screen" style={card}>
        {backBtn}
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: c.text,
          }}
        >
          New password
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: c.subtext, lineHeight: 1.45 }}>
          Create a new password for your account.
        </p>

        <form onSubmit={handleResetPasswordSubmit}>
          <label style={label} htmlFor="reset-pass">
            New password
          </label>
          <input
            id="reset-pass"
            type="password"
            autoComplete="new-password"
            placeholder="Strong password"
            value={resetPassword}
            onChange={(ev) => {
              setResetPassword(ev.target.value)
              setError('')
            }}
            style={{ ...pillInput, marginBottom: 16 }}
          />

          <label style={label} htmlFor="reset-pass-confirm">
            Confirm new password
          </label>
          <input
            id="reset-pass-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={resetPasswordConfirm}
            onChange={(ev) => {
              setResetPasswordConfirm(ev.target.value)
              setError('')
            }}
            style={{ ...pillInput, marginBottom: 12 }}
          />

          <ul
            style={{
              margin: '0 0 18px',
              paddingLeft: 18,
              fontSize: 12,
              color: c.subtext,
              lineHeight: 1.55,
            }}
          >
            <li>At least 9 characters</li>
            <li>One uppercase and one lowercase letter</li>
            <li>One special character</li>
          </ul>
          {error ? (
            <p style={{ margin: '0 0 14px', fontSize: 13, color: c.danger }}>{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            style={{
              ...primaryBtn,
              opacity: busy ? 0.85 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {busy ? 'Please wait…' : 'Update password'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="auth-screen" style={card}>
      {backBtn}
      <h1
        style={{
          margin: '0 0 8px',
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: c.text,
        }}
      >
        Create your account
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: c.subtext, lineHeight: 1.45 }}>
        You&apos;re signing up as <strong style={{ color: c.text }}>{flowEmail}</strong>
      </p>

      <form onSubmit={handleRegisterSubmit}>
        <label style={label} htmlFor="reg-email-ro">
          Email
        </label>
        <input
          id="reg-email-ro"
          readOnly
          value={flowEmail}
          style={{
            ...pillInput,
            marginBottom: 16,
            background: c.bg,
            opacity: 1,
          }}
        />

        <label style={label} htmlFor="reg-user">
          Username
        </label>
        <input
          id="reg-user"
          autoComplete="username"
          placeholder="Choose a username"
          value={regUsername}
          onChange={(ev) => setRegUsername(ev.target.value)}
          style={{ ...pillInput, marginBottom: 16 }}
        />

        <label style={label} htmlFor="reg-pass">
          Password
        </label>
        <input
          id="reg-pass"
          type="password"
          autoComplete="new-password"
          placeholder="Strong password"
          value={regPassword}
          onChange={(ev) => setRegPassword(ev.target.value)}
          style={{ ...pillInput, marginBottom: 12 }}
        />
        <ul
          style={{
            margin: '0 0 18px',
            paddingLeft: 18,
            fontSize: 12,
            color: c.subtext,
            lineHeight: 1.55,
          }}
        >
          <li>At least 9 characters</li>
          <li>One uppercase and one lowercase letter</li>
          <li>One special character</li>
        </ul>
        {error ? (
          <p style={{ margin: '0 0 14px', fontSize: 13, color: c.danger }}>{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          style={{
            ...primaryBtn,
            opacity: busy ? 0.85 : 1,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Please wait…' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
