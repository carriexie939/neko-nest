import { useEffect, useState } from 'react'
import { tokens } from '../theme/tokens'

export function ProfileView({
  user,
  petName,
  onUpdateUsername,
  onUpdatePetName,
  onChangePassword,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [username, setUsername] = useState(user?.username || '')
  const [petNameInput, setPetNameInput] = useState(petName || 'Cookie')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setUsername(user?.username || '')
  }, [user?.username])

  useEffect(() => {
    setPetNameInput(petName || 'Cookie')
  }, [petName])

  function openDialog(nextDialog) {
    setDialog(nextDialog)
    setMenuOpen(false)
    setStatus('')
    setError('')
  }

  function closeDialog() {
    setDialog(null)
    setStatus('')
    setError('')
    setNewPassword('')
    setConfirmPassword('')
  }

  async function saveName(event) {
    event.preventDefault()
    setError('')
    setStatus('')
    try {
      await onUpdateUsername(username)
      await onUpdatePetName(petNameInput)
      setStatus('Saved.')
    } catch (err) {
      setError(err.message || 'Could not save name settings.')
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setError('')
    setStatus('')
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    try {
      await onChangePassword({ newPassword })
      setNewPassword('')
      setConfirmPassword('')
      setStatus('Password updated.')
    } catch (err) {
      setError(err.message || 'Could not update password.')
    }
  }

  return (
    <div style={wrap}>
      <button
        type="button"
        className="btn-ghost"
        style={profileButton}
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
      >
        Profile
      </button>

      {menuOpen ? (
        <div style={menu} role="menu">
          <button type="button" style={menuItem} onClick={() => openDialog('name')}>
            Name
          </button>
          <button type="button" style={menuItem} onClick={() => openDialog('password')}>
            Password
          </button>
          <button type="button" style={{ ...menuItem, color: tokens.color.danger }} onClick={onLogout}>
            Log out
          </button>
        </div>
      ) : null}

      {dialog ? (
        <div style={overlay} onMouseDown={closeDialog}>
          <section style={modal} onMouseDown={(event) => event.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={title}>{dialog === 'name' ? 'Name' : 'Password'}</h3>
              <button type="button" className="btn-ghost" style={closeButton} onClick={closeDialog}>
                x
              </button>
            </div>

            {dialog === 'name' ? (
              <form onSubmit={saveName}>
                <label style={label}>Username</label>
                <input
                  style={input}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    setError('')
                    setStatus('')
                  }}
                  placeholder="Username"
                />

                <label style={label}>Pet name</label>
                <input
                  style={input}
                  value={petNameInput}
                  onChange={(event) => {
                    setPetNameInput(event.target.value)
                    setError('')
                    setStatus('')
                  }}
                  placeholder="Pet name"
                />

                {error ? <p style={errorText}>{error}</p> : null}
                {status ? <p style={okText}>{status}</p> : null}
                <button type="submit" className="btn-action" style={{ width: '100%' }}>
                  Save
                </button>
              </form>
            ) : (
              <form onSubmit={savePassword}>
                <label style={label}>New password</label>
                <input
                  style={input}
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    setError('')
                    setStatus('')
                  }}
                  placeholder="New password"
                />

                <label style={label}>Confirm new password</label>
                <input
                  style={input}
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setError('')
                    setStatus('')
                  }}
                  placeholder="Confirm new password"
                />

                {error ? <p style={errorText}>{error}</p> : null}
                {status ? <p style={okText}>{status}</p> : null}
                <button type="submit" className="btn-action" style={{ width: '100%' }}>
                  Update password
                </button>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}

const wrap = {
  position: 'relative',
  flexShrink: 0,
}

const profileButton = {
  marginTop: 4,
}

const menu = {
  position: 'absolute',
  top: '100%',
  right: 0,
  zIndex: 70,
  marginTop: 6,
  width: 150,
  padding: 6,
  background: '#fff',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.soft,
}

const menuItem = {
  width: '100%',
  border: 0,
  background: 'transparent',
  padding: '9px 10px',
  borderRadius: tokens.radius.sm,
  textAlign: 'left',
  color: tokens.color.text,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

const overlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 90,
  background: 'rgba(30, 41, 59, 0.24)',
  display: 'grid',
  placeItems: 'center',
  padding: 18,
}

const modal = {
  width: '100%',
  maxWidth: 360,
  background: tokens.color.panel,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.lg,
  boxShadow: '0 18px 60px rgba(0,0,0,0.18)',
  padding: 14,
}

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 8,
}

const title = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
}

const closeButton = {
  padding: '4px 9px',
  lineHeight: 1,
}

const label = {
  display: 'block',
  fontSize: 13,
  fontWeight: 800,
  color: tokens.color.subtext,
  marginBottom: 4,
}

const input = {
  width: '100%',
  boxSizing: 'border-box',
  marginBottom: 10,
  padding: 10,
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.color.border}`,
  background: '#fff',
  fontSize: 14,
}

const errorText = {
  color: tokens.color.danger,
  margin: '0 0 10px',
  fontSize: 13,
}

const okText = {
  color: '#047857',
  margin: '0 0 10px',
  fontSize: 13,
  fontWeight: 700,
}
