import { CatCard } from '../components/CatCard'
import { useState } from 'react'
import { tokens } from '../theme/tokens'

function txId(tx) {
  return tx._id || tx.id
}

export function HomeView({
  weeklySummary,
  catState,
  weeklyBudget,
  budgetInput,
  setBudgetInput,
  budgetError,
  setBudgetError,
  handleBudgetSubmit,
  type,
  handleTypeChange,
  title,
  setTitle,
  description,
  setDescription,
  amount,
  setAmount,
  category,
  setCategory,
  txDateFrom,
  setTxDateFrom,
  txDateTo,
  setTxDateTo,
  transactionError,
  setTransactionError,
  handleAddTransaction,
  transactions,
  handleDeleteTransaction,
  handleEditTransaction,
  formatTransactionDate,
  categoryOptions,
}) {
  const [showRecent, setShowRecent] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({})

  function toDateValue(d) {
    try {
      const dt = new Date(d)
      if (Number.isNaN(dt.getTime())) return ''
      const pad = (n) => String(n).padStart(2, '0')
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
    } catch { return '' }
  }

  function startEdit(tx) {
    setEditingId(txId(tx))
    setEditFields({
      title: tx.title || '',
      description: tx.description || '',
      amount: String(tx.amount),
      category: tx.category || '',
      type: tx.type || 'expense',
      date: toDateValue(tx.date),
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditFields({})
  }

  function saveEdit(id) {
    const update = {
      title: editFields.title,
      description: editFields.description,
      amount: Number(editFields.amount) || 0,
      category: editFields.category,
      type: editFields.type,
    }
    if (editFields.date) {
      const [y, m, d] = editFields.date.split('-').map(Number)
      update.date = new Date(y, m - 1, d).toISOString()
    }
    handleEditTransaction(id, update)
    cancelEdit()
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CatCard
        catState={catState}
        expense={weeklySummary.expense}
        weeklyBudget={weeklyBudget}
        remaining={weeklySummary.remaining}
        budgetInput={budgetInput}
        setBudgetInput={setBudgetInput}
        budgetError={budgetError}
        setBudgetError={setBudgetError}
        handleBudgetSubmit={handleBudgetSubmit}
      />


      <form onSubmit={handleAddTransaction} style={card} aria-label="Add transaction">
        <h3 style={{ ...cardTitle, color: '#3b82f6' }}>Add expense / income</h3>

        <label style={fieldLabel}>Date</label>
        <input
          type="date"
          value={txDateFrom}
          onChange={(e) => {
            setTxDateFrom(e.target.value)
            setTxDateTo(e.target.value)
          }}
          style={fieldInputFull}
        />

        <label style={fieldLabel}>Type</label>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          style={fieldInputFull}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <label style={fieldLabel}>Category / Title</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...fieldInputFull, flex: 1 }}
          >
            {(categoryOptions[type] || []).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Lunch)"
            style={{ ...fieldInputFull, flex: 1 }}
          />
        </div>

        <label style={fieldLabel}>Amount</label>
        <input
          value={amount}
          onChange={(e) => {
            setAmount(limitAmountInput(e.target.value))
            setTransactionError('')
          }}
          placeholder="0.00"
          inputMode="decimal"
          style={fieldInputFull}
        />

        <label style={fieldLabel}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes"
          rows={2}
          style={{ ...fieldInputFull, resize: 'vertical' }}
        />

        {transactionError ? <p style={errorLine}>{transactionError}</p> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="submit" className="btn-action">Save entry</button>
        </div>
      </form>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ ...cardTitle, marginBottom: 0, color: '#3b82f6' }}>Recent records</h3>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: 15 }}
              onClick={() => { setShowSearch((s) => !s); setSearchQuery('') }}
              title="Search"
              aria-label="Search records"
            >
              🔍
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowRecent((s) => !s)}>
              {showRecent ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        {showSearch && (
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by amount, title, category..."
            aria-label="Search transactions"
            style={{ ...fieldInputFull, marginTop: 8 }}
          />
        )}
        {!showRecent ? null : (() => {
          const q = searchQuery.trim().toLowerCase()
          const filtered = transactions.filter((tx) => {
            if (!q) return true
            const amt = String(tx.amount)
            const title = (tx.title || '').toLowerCase()
            const cat = (tx.category || '').toLowerCase()
            const desc = (tx.description || '').toLowerCase()
            return amt.includes(q) || title.includes(q) || cat.includes(q) || desc.includes(q)
          }).slice(0, 20)
          return filtered.length === 0 ? (
            <p style={{ margin: '10px 0 0', color: tokens.color.subtext }}>
              {transactions.length === 0 ? 'No transactions yet.' : 'No matching records.'}
            </p>
          ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', maxHeight: 260, overflowY: 'auto' }}>
            {filtered.map((tx, idx) => {
              const id = txId(tx)
              const isEditing = editingId === id

              if (isEditing) {
                const editCatOptions = categoryOptions[editFields.type] || categoryOptions.expense
                return (
                  <li key={id} style={{ ...logRow, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                    <input
                      value={editFields.title}
                      onChange={(e) => setEditFields((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Title"
                      style={fieldInput}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select
                        value={editFields.type}
                        onChange={(e) => {
                          const next = e.target.value
                          const opts = categoryOptions[next] || []
                          setEditFields((f) => ({
                            ...f,
                            type: next,
                            category: opts.includes(f.category) ? f.category : (opts[0] || ''),
                          }))
                        }}
                        style={{ ...fieldInput, flex: 1 }}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <input
                        value={editFields.amount}
                        onChange={(e) => setEditFields((f) => ({ ...f, amount: limitAmountInput(e.target.value) }))}
                        placeholder="Amount"
                        inputMode="decimal"
                        style={{ ...fieldInput, flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select
                        value={editFields.category}
                        onChange={(e) => setEditFields((f) => ({ ...f, category: e.target.value }))}
                        style={{ ...fieldInput, flex: 1 }}
                      >
                        {editCatOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editFields.date}
                        onChange={(e) => setEditFields((f) => ({ ...f, date: e.target.value }))}
                        style={{ ...fieldInput, flex: 1 }}
                      />
                    </div>
                    <textarea
                      value={editFields.description}
                      onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Description"
                      rows={2}
                      style={{ ...fieldInput, resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancel</button>
                      <button type="button" className="btn-action" onClick={() => saveEdit(id)}>Save</button>
                    </div>
                  </li>
                )
              }

              return (
                <li key={id} style={logRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      [{tx.type}] {formatMoney5(tx.amount)}
                      {tx.title ? ` — ${tx.title}` : ''}
                    </div>
                    <div style={{ fontSize: 13, color: tokens.color.subtext }}>
                      {tx.category} · {formatTransactionDate(tx.date)}
                    </div>
                    {tx.description ? (
                      <div style={{ fontSize: 12, color: tokens.color.subtext, marginTop: 2 }}>
                        {tx.description}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button type="button" className="btn-edit" onClick={() => startEdit(tx)}>Edit</button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => { if (window.confirm('Delete this record?')) handleDeleteTransaction(id) }}
                    >Delete</button>
                  </div>
                </li>
              )
            })}
          </ul>
          )
        })()}
      </div>
    </section>
  )
}

const card = {
  background: '#eef4fb',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  padding: 16,
  boxShadow: tokens.shadow.soft,
}

const cardTitle = {
  margin: '0 0 10px',
  fontSize: 15,
  fontWeight: 700,
}

const fieldInput = {
  padding: '9px 10px',
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.color.border}`,
  background: '#fff',
  fontSize: 14,
}

const fieldInputFull = {
  ...fieldInput,
  width: '100%',
}

const fieldLabel = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: tokens.color.subtext,
  marginTop: 10,
  marginBottom: 4,
}


const errorLine = {
  color: tokens.color.danger,
  margin: '6px 0 0',
  fontSize: 13,
}

const logRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  padding: '10px 0',
  borderTop: `1px solid ${tokens.color.border}`,
}

function limitAmountInput(value) {
  const raw = String(value).replace(/[^\d.]/g, '')
  const parts = raw.split('.')
  const intPart = (parts[0] || '').slice(0, 5)
  if (parts.length === 1) return intPart
  return `${intPart}.${(parts[1] || '').slice(0, 2)}`
}

function formatMoney5(value) {
  const n = Number(value || 0)
  const abs = Math.min(Math.abs(n), 99999)
  const prefix = n < 0 ? '-$' : '$'
  return `${prefix}${abs.toFixed(2)}`
}
