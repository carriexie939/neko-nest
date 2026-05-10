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

/** Multicolor “G” sized to match `IconInstagram` (22×22). */
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

function IconInstagram() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="nekoIgGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="0.5" stopColor="#dc2743" />
          <stop offset="1" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <path
        fill="url(#nekoIgGrad)"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
      />
    </svg>
  )
}

const WELCOME_PAWS_URL = '/auth-welcome-paws.png'
const fontHandwritten = "'Caveat', 'Segoe Print', 'Bradley Hand', cursive"

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
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  /** GIS renders here off-screen; visible row matches Instagram spacing. */
  const googleHiddenRef = useRef(null)
  /** GIS allows only one initialize() per page; keep callback fresh via ref. */
  const onAuthenticatedRef = useRef(onAuthenticated)
  onAuthenticatedRef.current = onAuthenticated
  const googleInitClientRef = useRef(null)

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

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

  /** Visually aligned with Google GIS “outline” pill (no extra outer frame). */
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
    if (flashError) {
      setError(flashError)
      onClearFlash?.()
    }
  }, [flashError, onClearFlash])

  useEffect(() => {
    if (!googleClientId) return
    if (document.querySelector('script[data-neko-gsi]')) return
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.dataset.nekoGsi = '1'
    document.head.appendChild(s)
  }, [googleClientId])

  useEffect(() => {
    if (!googleClientId || screen !== 'welcome') return

    let cancelled = false
    let pollId = 0
    let rafOuter = 0
    let rafInner = 0

    function mountButton() {
      if (cancelled) return
      const el = googleHiddenRef.current
      if (!el || !window.google?.accounts?.id) {
        pollId = window.setTimeout(mountButton, 40)
        return
      }

      if (googleInitClientRef.current !== googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (res) => {
            if (!res.credential) return
            setError('')
            setBusy(true)
            try {
              const r = await api.oauthGoogle(res.credential)
              setSession(r.token, r.user)
              onAuthenticatedRef.current(r.user)
            } catch (e) {
              setError(e.message || 'Google sign-in failed.')
            } finally {
              setBusy(false)
            }
          },
        })
        googleInitClientRef.current = googleClientId
      }

      el.innerHTML = ''
      const width = 400

      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width,
      })
    }

    rafOuter = requestAnimationFrame(() => {
      rafInner = requestAnimationFrame(mountButton)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafOuter)
      cancelAnimationFrame(rafInner)
      window.clearTimeout(pollId)
    }
  }, [screen, googleClientId])

  function triggerGoogleSignIn() {
    const el = googleHiddenRef.current?.querySelector('[role="button"]')
    if (el) {
      el.click()
      return
    }
    requestAnimationFrame(() => {
      googleHiddenRef.current?.querySelector('[role="button"]')?.click()
    })
  }

  function startOAuth(path) {
    setError('')
    window.location.href = `/api/auth/oauth${path}`
  }

  function goWelcome() {
    setScreen('welcome')
    setError('')
    setPassword('')
    setRegUsername('')
    setRegPassword('')
    setFlowEmail('')
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
      if (registered) setScreen('login-password')
      else {
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
      By continuing, you agree to NekoNest&apos;s{' '}
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
      <div className="auth-screen" style={card}>
        <WelcomeHero />
        <p
          style={{
            margin: '34px 0 28px',
            fontSize: 14,
            color: c.subtext,
            textAlign: 'center',
            lineHeight: 1.45,
          }}
        >
          Sign in to NekoNest
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {googleClientId ? (
            <div style={{ position: 'relative', width: '100%' }}>
              <div
                ref={googleHiddenRef}
                className="auth-google-slot"
                aria-hidden
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  top: 0,
                  width: 400,
                  height: 54,
                  overflow: 'hidden',
                }}
              />
              <button
                type="button"
                onClick={triggerGoogleSignIn}
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
                Continue with Google
              </button>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: c.subtext, textAlign: 'center' }}>
              Add <code style={{ fontSize: 11, color: c.text }}>VITE_GOOGLE_CLIENT_ID</code> to enable Google.
            </p>
          )}

          <button
            type="button"
            onClick={() => startOAuth('/instagram/start')}
            disabled={busy}
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
              <IconInstagram />
            </span>
            Continue with Instagram
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
