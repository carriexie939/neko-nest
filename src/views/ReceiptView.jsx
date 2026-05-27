import { useMemo, useState } from 'react'
import * as api from '../utils/api'
import { tokens } from '../theme/tokens'

const CATEGORY_OPTIONS = [
  'food',
  'transport',
  'housing',
  'shopping',
  'entertainment',
  'education',
  'healthcare',
  'bills',
  'travel',
  'others',
]

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const UNSUPPORTED_IMAGE_MESSAGE = 'iPhone HEIC/HEIF photos are not supported for AI parsing yet. Please upload a JPG/PNG/WebP image, take a screenshot of the receipt, or set iPhone Camera > Formats to Most Compatible.'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function emptyDraft() {
  return {
    merchant: '',
    title: '',
    description: '',
    amount: '',
    category: 'others',
    date: todayDate(),
    items: [],
    confidence: 0,
    rawDate: '',
    message: '',
  }
}

function formatAmountInput(value) {
  const raw = String(value).replace(/[^\d.]/g, '')
  const parts = raw.split('.')
  const intPart = (parts[0] || '').slice(0, 5)
  if (parts.length === 1) return intPart
  return `${intPart}.${(parts[1] || '').slice(0, 2)}`
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read receipt image.'))
    reader.readAsDataURL(file)
  })
}

function isUnsupportedIphoneImage(file) {
  const type = String(file?.type || '').toLowerCase()
  const name = String(file?.name || '').toLowerCase()
  return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif')
}

function validateImageFile(file) {
  if (isUnsupportedIphoneImage(file)) return UNSUPPORTED_IMAGE_MESSAGE
  if (!SUPPORTED_IMAGE_TYPES.has(String(file?.type || '').toLowerCase())) {
    return 'Please upload a supported receipt image: JPG, PNG, GIF, or WebP.'
  }
  return ''
}

function friendlyReceiptError(message) {
  const text = String(message || '')
  if (text.includes('valid image') || text.includes('supported image formats')) return UNSUPPORTED_IMAGE_MESSAGE
  return text || 'Receipt parsing failed.'
}

function dateInputToLocalIso(value) {
  const [y, m, d] = String(value).split('-').map(Number)
  if (![y, m, d].every(Number.isFinite)) return new Date().toISOString()
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString()
}

export function ReceiptView({ onCreateReceiptExpense, categoryOptions = CATEGORY_OPTIONS }) {
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [draft, setDraft] = useState(() => emptyDraft())
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')

  const canSave = useMemo(() => {
    const amount = Number(draft.amount)
    return Number.isFinite(amount) && amount > 0 && draft.date && draft.category
  }, [draft])

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setSaveError('')
    setPhase('parsing')
    setFileName(file.name)

    try {
      const fileError = validateImageFile(file)
      if (fileError) {
        setPreviewUrl('')
        setDraft(emptyDraft())
        setError(fileError)
        setPhase('review')
        event.target.value = ''
        return
      }
      const dataUrl = await readImageAsDataUrl(file)
      setPreviewUrl(dataUrl)
      const parsed = await api.parseReceipt(dataUrl)
      setDraft({
        ...emptyDraft(),
        ...parsed,
        amount: parsed.amount === '' ? '' : formatAmountInput(parsed.amount),
        date: parsed.date || todayDate(),
      })
      setPhase('review')
    } catch (err) {
      setDraft(emptyDraft())
      setError(friendlyReceiptError(err.message))
      setPhase('review')
    }
  }

  function updateDraft(key, value) {
    setSaveError('')
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    const amount = Number(draft.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setSaveError('Please confirm a valid amount.')
      return
    }
    if (!draft.date) {
      setSaveError('Please confirm the receipt date.')
      return
    }

    try {
      await onCreateReceiptExpense({
        title: draft.title.trim() || draft.merchant.trim() || 'Receipt expense',
        description: [
          draft.description.trim(),
          draft.merchant.trim() ? `Merchant: ${draft.merchant.trim()}` : '',
          fileName ? `Receipt: ${fileName}` : '',
        ].filter(Boolean).join('\n'),
        type: 'expense',
        amount,
        category: draft.category || 'others',
        date: dateInputToLocalIso(draft.date),
        merchant: draft.merchant.trim(),
        receiptItems: draft.items || [],
        source: 'receipt',
      })
      setPreviewUrl('')
      setFileName('')
      setDraft(emptyDraft())
      setPhase('idle')
      setSaveError('')
    } catch (err) {
      setSaveError(err.message || 'Could not save receipt expense.')
    }
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h3 style={cardTitle}>Receipt capture</h3>
            <p style={muted}>Take a photo, review, then save.</p>
          </div>
          <span aria-hidden style={{ fontSize: 24 }}>📷</span>
        </div>

        <label style={uploadBox}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            capture="environment"
            onChange={handleFileChange}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          />
          <span style={{ fontWeight: 800 }}>{phase === 'parsing' ? 'Reading receipt...' : 'Take photo or upload'}</span>
          <span style={{ fontSize: 12, color: tokens.color.subtext }}>JPG, PNG, GIF, or WebP. iPhone HEIC is not supported.</span>
        </label>

        {previewUrl ? (
          <div style={{ marginTop: 8 }}>
            <img src={previewUrl} alt="Receipt preview" style={previewImage} />
          </div>
        ) : null}
      </div>

      {phase !== 'idle' ? (
        <form onSubmit={handleSave} style={card}>
          <h3 style={cardTitle}>Review parsed expense</h3>
          {error ? <p style={errorLine}>{error}</p> : null}
          {draft.message ? <p style={noticeLine}>{draft.message}</p> : null}

          <div style={compactGrid}>
            <div>
              <label style={fieldLabel}>Merchant / store</label>
              <input
                value={draft.merchant}
                onChange={(e) => updateDraft('merchant', e.target.value)}
                placeholder="Merchant name"
                style={fieldInputFull}
              />
            </div>
            <div>
              <label style={fieldLabel}>Title / record name</label>
              <input
                value={draft.title}
                onChange={(e) => updateDraft('title', e.target.value)}
                placeholder="Receipt expense"
                style={fieldInputFull}
              />
            </div>
          </div>

          <div style={compactGrid}>
            <div>
              <label style={fieldLabel}>Amount</label>
              <input
                value={draft.amount}
                onChange={(e) => updateDraft('amount', formatAmountInput(e.target.value))}
                inputMode="decimal"
                placeholder="0.00"
                style={fieldInputFull}
              />
            </div>
            <div>
              <label style={fieldLabel}>Date</label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => updateDraft('date', e.target.value)}
                style={fieldInputFull}
              />
              {draft.rawDate ? <div style={dateHint}>Detected: {draft.rawDate}</div> : null}
            </div>
          </div>

          <div style={compactGrid}>
            <div>
              <label style={fieldLabel}>Category</label>
              <select
                value={draft.category}
                onChange={(e) => updateDraft('category', e.target.value)}
                style={fieldInputFull}
              >
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Notes</label>
              <input
                value={draft.description}
                onChange={(e) => updateDraft('description', e.target.value)}
                placeholder="Optional notes"
                style={fieldInputFull}
              />
            </div>
          </div>

          {draft.items?.length ? (
            <div style={itemsBox}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Detected items</div>
              {draft.items.slice(0, 6).map((item, idx) => (
                <div key={`${item.name}-${idx}`} style={itemRow}>
                  <span>{item.name || `Item ${idx + 1}`}</span>
                  <span>${Number(item.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {saveError ? <p style={errorLine}>{saveError}</p> : null}

          <button type="submit" className="btn-action" disabled={!canSave || phase === 'parsing'} style={{ width: '100%', marginTop: 10 }}>
            Save expense
          </button>
        </form>
      ) : null}
    </section>
  )
}

const card = {
  background: '#eef4fb',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  padding: 12,
  boxShadow: tokens.shadow.soft,
}

const cardTitle = {
  margin: '0 0 6px',
  fontSize: 16,
  fontWeight: 800,
  color: '#3b82f6',
}

const muted = {
  margin: 0,
  fontSize: 12,
  color: tokens.color.subtext,
  lineHeight: 1.4,
}

const uploadBox = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  minHeight: 72,
  marginTop: 10,
  borderRadius: tokens.radius.md,
  border: '1.5px dashed #8bb6e8',
  background: '#fff',
  cursor: 'pointer',
}

const previewImage = {
  width: '100%',
  maxHeight: 132,
  objectFit: 'contain',
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.color.border}`,
  background: '#fff',
}

const fieldInputFull = {
  width: '100%',
  padding: '8px 9px',
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.color.border}`,
  background: '#fff',
  fontSize: 14,
  boxSizing: 'border-box',
}

const fieldLabel = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: tokens.color.subtext,
  marginTop: 8,
  marginBottom: 4,
}

const dateHint = {
  marginTop: 4,
  fontSize: 11,
  color: tokens.color.subtext,
}

const compactGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
}

const errorLine = {
  color: tokens.color.danger,
  margin: '8px 0 0',
  fontSize: 13,
}

const noticeLine = {
  color: tokens.color.subtext,
  background: '#fff',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.sm,
  padding: 8,
  margin: '8px 0',
  fontSize: 12,
}

const itemsBox = {
  marginTop: 8,
  padding: 8,
  background: '#fff',
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.color.border}`,
  maxHeight: 116,
  overflowY: 'auto',
}

const itemRow = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '4px 0',
  fontSize: 12,
  color: tokens.color.subtext,
}
