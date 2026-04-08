import { useState } from 'react'
import { CAT_STATES, getCatMoodCopy, getCatMoodLabel } from '../domain/catState'
import { tokens } from '../theme/tokens'
import catWelcome from '../assets/cat-welcome.mp4'
import catIdle from '../assets/cat-idle.mp4'
import catHappy from '../assets/cat-happy.mp4'
import catShocked from '../assets/cat-shocked.mp4'
import catAngry from '../assets/cat-angry.mp4'

const MOOD_COLORS = {
  [CAT_STATES.WELCOME]: '#ca8a04',
  [CAT_STATES.IDLE]: '#3b82f6',
  [CAT_STATES.HAPPY]: '#ec4899',
  [CAT_STATES.SHOCKED]: '#1a1a1a',
  [CAT_STATES.ANGRY]: '#dc2626',
}

const VIDEO_MAP = {
  [CAT_STATES.WELCOME]: catWelcome,
  [CAT_STATES.IDLE]: catIdle,
  [CAT_STATES.HAPPY]: catHappy,
  [CAT_STATES.SHOCKED]: catShocked,
  [CAT_STATES.ANGRY]: catAngry,
}

export function CatCard({
  catState, expense, weeklyBudget, remaining,
  budgetInput, setBudgetInput, budgetError, setBudgetError, handleBudgetSubmit,
}) {
  const videoSrc = VIDEO_MAP[catState] || catIdle
  const [editing, setEditing] = useState(false)

  function onBudgetSubmit(e) {
    e.preventDefault()
    handleBudgetSubmit(e)
    setEditing(false)
  }

  return (
    <section style={outerCard} aria-label="Cat companion status">
      <div style={heroWrap}>
        <div style={videoWrap}>
          <video
            key={catState}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            aria-label={`Cat is ${getCatMoodLabel(catState).toLowerCase()}`}
            style={videoStyle}
          />
        </div>

        <div style={statusCard}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: tokens.color.subtext, fontWeight: 700 }}>
              YOUR CAT
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginTop: 2, color: MOOD_COLORS[catState] || tokens.color.text }}>
              {getCatMoodLabel(catState)}
            </div>
            <p style={{ margin: '6px 0 0', color: tokens.color.subtext, fontSize: 13 }}>
              {getCatMoodCopy(catState)}
            </p>

            <div style={{ marginTop: 10 }}>
              {editing ? (
                <form onSubmit={onBudgetSubmit} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#a0896e' }}>Weekly budget</span>
                  <input
                    value={budgetInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, '')
                      const parts = raw.split('.')
                      const int = (parts[0] || '').slice(0, 5)
                      setBudgetInput(parts.length === 1 ? int : `${int}.${(parts[1] || '').slice(0, 2)}`)
                      setBudgetError('')
                    }}
                    inputMode="decimal"
                    autoFocus
                    style={{ width: 80, padding: '4px 6px', borderRadius: 6, border: `1px solid ${tokens.color.border}`, fontSize: 14, fontWeight: 800 }}
                  />
                  <button type="submit" className="btn-action" style={{ padding: '4px 10px', fontSize: 12 }}>Save</button>
                  <button type="button" className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setEditing(false)}>✕</button>
                </form>
              ) : (
                <div
                  onClick={() => setEditing(true)}
                  style={{ cursor: 'pointer', display: 'inline-block' }}
                  title="Click to edit budget"
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#a0896e' }}>
                    Weekly budget <span style={{ fontSize: 10 }}>✏️</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#ca8a04' }}>{fmtMoney(weeklyBudget)}</div>
                </div>
              )}
              {budgetError ? <div style={{ fontSize: 12, color: tokens.color.danger, marginTop: 2 }}>{budgetError}</div> : null}
            </div>

            <div style={{ ...statsRow, marginTop: 8 }}>
              <StatPair label="Spent this week" value={expense} />
              <StatPair label="Remaining" value={remaining} highlight={remaining < 0} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatPair({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#a0896e' }}>{label}</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: highlight ? tokens.color.danger : tokens.color.text,
        }}
      >
        {fmtMoney(value)}
      </div>
    </div>
  )
}

function fmtMoney(value) {
  const n = Number(value || 0)
  const abs = Math.min(Math.abs(n), 99999)
  return `${n < 0 ? '-' : ''}$${abs.toFixed(2)}`
}

const outerCard = {
  background: tokens.color.panel,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadow.soft,
  padding: 16,
}

const heroWrap = {
  width: '100%',
  borderRadius: 14,
  overflow: 'hidden',
  border: `1px solid ${tokens.color.border}`,
  background: '#f9f6ef',
}

const videoWrap = {
  display: 'flex',
  justifyContent: 'center',
  padding: '12px 12px 0',
}

const videoStyle = {
  width: '100%',
  maxWidth: 260,
  borderRadius: 12,
  objectFit: 'cover',
}

const statusCard = {
  background: '#f9f6ef',
  margin: '0 8px 8px',
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  textAlign: 'left',
}

const statsRow = {
  display: 'flex',
  gap: 20,
  marginTop: 10,
}
