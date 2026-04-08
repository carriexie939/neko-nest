import { useMemo, useState } from 'react'
import { computeSplit } from '../domain/split'
import { tokens } from '../theme/tokens'

export function SplitView({ onCreateSplitExpense }) {
  const [billName, setBillName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [participantCount, setParticipantCount] = useState('2')
  const [mode, setMode] = useState('auto')
  const [manualShares, setManualShares] = useState(['', ''])
  const [error, setError] = useState('')

  const splitResult = useMemo(
    () =>
      computeSplit({
        totalAmount,
        participantCount,
        mode,
        manualShares,
      }),
    [totalAmount, participantCount, mode, manualShares],
  )

  function syncManualShares(count) {
    setManualShares((prev) => {
      const next = Array.from({ length: count }).map((_, idx) => prev[idx] || '')
      return next
    })
  }

  function handleCountChange(nextValue) {
    setParticipantCount(nextValue)
    const count = Math.max(1, Math.floor(Number(nextValue) || 1))
    syncManualShares(count)
  }

  function handleSubmitSplit(event) {
    event.preventDefault()
    if (!billName.trim()) {
      setError('Please enter a bill name.')
      return
    }
    if ((Number(totalAmount) || 0) <= 0) {
      setError('Please enter a valid total amount.')
      return
    }
    if (mode === 'manual' && !splitResult.isValid) {
      setError('Manual shares must match total amount.')
      return
    }

    onCreateSplitExpense({
      billName: billName.trim(),
      amount: Number(totalAmount),
      participantCount: Number(participantCount),
      shares: splitResult.shares,
    })
    setError('')
    setBillName('')
    setTotalAmount('')
  }

  const card = {
    background: '#fefce8',
    border: `1px solid #e5d9a8`,
    borderRadius: tokens.radius.md,
    padding: 14,
    marginBottom: 12,
    boxShadow: tokens.shadow.soft,
  }

  return (
    <section>
      <form onSubmit={handleSubmitSplit} style={card}>
        <h3 style={{ marginTop: 0 }}>Split Bill</h3>
        <input
          style={inputStyle}
          value={billName}
          onChange={(e) => setBillName(e.target.value)}
          placeholder="Bill name"
        />
        <input
          style={inputStyle}
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Total amount"
        />
        <input
          style={inputStyle}
          value={participantCount}
          onChange={(e) => handleCountChange(e.target.value)}
          inputMode="numeric"
          placeholder="Participants"
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" className={mode === 'auto' ? 'btn-action' : 'btn-ghost'} onClick={() => setMode('auto')}>
            Auto Split
          </button>
          <button type="button" className={mode === 'manual' ? 'btn-action' : 'btn-ghost'} onClick={() => setMode('manual')}>
            Manual Split
          </button>
        </div>
        {mode === 'manual' &&
          manualShares.map((value, idx) => (
            <input
              key={idx}
              style={inputStyle}
              value={value}
              onChange={(e) =>
                setManualShares((prev) => prev.map((item, i) => (i === idx ? e.target.value : item)))
              }
              inputMode="decimal"
              placeholder={`P${idx + 1} share`}
            />
          ))}
        {error ? <p style={{ color: tokens.color.danger, margin: '0 0 8px' }}>{error}</p> : null}
        <button type="submit" className="btn-action">
          Save as Expense
        </button>
      </form>

      <section style={billCard}>
        <div style={billHeader}>
          <div style={{ fontSize: 11, color: '#a0896e', letterSpacing: 1 }}>SPLIT BILL</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
            {billName.trim() || 'Untitled Bill'}
          </div>
          <div style={{ fontSize: 11, color: '#a0896e', marginTop: 4 }}>
            ID: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a5f' }}>
              PAY-{Date.now().toString(36).toUpperCase().slice(-6)}
            </span>
          </div>
        </div>

        <div style={billDivider} />

        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a0896e', marginBottom: 6 }}>
            <span>Total</span>
            <span style={{ fontWeight: 800, color: '#1e3a5f', fontSize: 16 }}>
              ${(Number(totalAmount) || 0).toFixed(2)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#a0896e', marginBottom: 8 }}>
            {splitResult.mode === 'auto' ? 'Equal split' : 'Manual split'} · {participantCount} people
          </div>
        </div>

        <div style={billDivider} />

        <div style={{ padding: '8px 16px 0' }}>
          {splitResult.shares.map((row, i) => (
            <div key={row.name} style={billRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={billAvatar}>{row.name.charAt(0)}</div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{row.name}</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#1e3a5f' }}>
                ${row.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div style={billDivider} />

        <div style={{ padding: '8px 16px 12px', textAlign: 'center', fontSize: 11, color: '#b0a590' }}>
          {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · NekoNest
        </div>
      </section>
    </section>
  )
}

const inputStyle = {
  width: '100%',
  marginBottom: 8,
  padding: 10,
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.color.border}`,
  background: '#fff',
}

const billCard = {
  background: '#fff',
  border: `1px solid #e5d9a8`,
  borderRadius: 16,
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  overflow: 'hidden',
  marginBottom: 12,
}

const billHeader = {
  padding: '16px 16px 10px',
  textAlign: 'center',
}

const billDivider = {
  borderTop: '1px dashed #d9d0c6',
  margin: '0 12px',
}

const billRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #f3efe8',
}

const billAvatar = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: '#3b82f6',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 800,
}

