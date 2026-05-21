import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'

export const receiptsRouter = Router()
receiptsRouter.use(requireAuth)

const CATEGORY_HINTS = [
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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function fallbackReceiptDraft(message = 'AI receipt parsing is not configured yet.') {
  return {
    merchant: '',
    title: 'Receipt expense',
    description: '',
    type: 'expense',
    amount: '',
    category: 'others',
    date: todayIsoDate(),
    rawDate: '',
    confidence: 0,
    items: [],
    needsReview: true,
    message,
  }
}

function validIsoDate(value) {
  const text = String(value || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ''
  const [y, m, d] = text.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12, 0, 0, 0)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return ''
  return text
}

function parseReceiptPrintedDate(value) {
  const text = String(value || '').trim()
  const match = text.match(/(\d{1,4})[\/.-](\d{1,2})[\/.-](\d{1,4})/)
  if (!match) return ''

  const [, aRaw, bRaw, cRaw] = match
  const a = Number(aRaw)
  const b = Number(bRaw)
  const c = Number(cRaw)
  if (![a, b, c].every(Number.isFinite)) return ''

  let year
  let month
  let day

  if (aRaw.length === 4) {
    year = a
    month = b
    day = c
  } else {
    day = a
    month = b
    year = cRaw.length === 2 ? 2000 + c : c
  }

  const normalized = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return validIsoDate(normalized)
}

function titleLooksLikeReceiptHeader(value) {
  const text = String(value || '').trim().toLowerCase()
  if (!text) return true
  return (
    /\$\s*\d/.test(text) ||
    /\b(tax\s+invoice|invoice|receipt|eftpos|subtotal|total)\b/.test(text) ||
    /^\[?expense\]?/.test(text)
  )
}

function inferReceiptTitle({ merchant, category, items, title }) {
  const existingTitle = String(title || '').trim()
  if (existingTitle && !titleLooksLikeReceiptHeader(existingTitle)) return existingTitle

  const haystack = [
    merchant,
    category,
    ...(items || []).map((item) => item.name),
  ].join(' ').toLowerCase()

  if (
    category === 'food' ||
    /\b(grocery|groceries|supermarket|woolworths|coles|aldi|iga|costco|market|fruit|vegetable|milk|bread|eggs)\b/.test(haystack)
  ) {
    return 'Grocery purchase'
  }
  if (category === 'transport') return 'Transport purchase'
  if (category === 'shopping') return 'Shopping purchase'
  if (category === 'bills') return 'Bill payment'
  if (category === 'healthcare') return 'Healthcare purchase'
  if (category === 'travel') return 'Travel purchase'
  if (category === 'entertainment') return 'Entertainment purchase'
  return 'Receipt purchase'
}

function cleanReceiptDraft(raw) {
  const draft = raw && typeof raw === 'object' ? raw : {}
  const amount = Number(draft.amount)
  const category = CATEGORY_HINTS.includes(String(draft.category)) ? String(draft.category) : 'others'
  const merchant = String(draft.merchant || '').trim()
  const rawDate = String(draft.rawDate || draft.originalDate || '').trim()
  const date = parseReceiptPrintedDate(rawDate) || validIsoDate(draft.date) || todayIsoDate()
  const items = Array.isArray(draft.items)
    ? draft.items.slice(0, 20).map((item) => ({
        name: String(item?.name || '').trim(),
        amount: Number(item?.amount) || 0,
      })).filter((item) => item.name || item.amount > 0)
    : []
  const title = inferReceiptTitle({ merchant, category, items, title: draft.title })

  return {
    merchant,
    title,
    description: String(draft.description || '').trim(),
    type: 'expense',
    amount: Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : '',
    category,
    date,
    rawDate,
    confidence: Math.max(0, Math.min(1, Number(draft.confidence) || 0)),
    items,
    needsReview: true,
    message: String(draft.message || 'Review the parsed receipt before saving.'),
  }
}

function extractOutputText(response) {
  if (typeof response?.output_text === 'string') return response.output_text
  const chunks = []
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && content.text) chunks.push(content.text)
    }
  }
  return chunks.join('\n')
}

async function parseReceiptWithOpenAI(imageDataUrl) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return fallbackReceiptDraft('Add OPENAI_API_KEY on the server to enable AI receipt parsing.')
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_RECEIPT_MODEL || 'gpt-4.1-mini',
      instructions: [
        'You extract expense data from receipt photos for a personal finance app.',
        'Return only valid JSON. Do not include markdown.',
        `Use one category from: ${CATEGORY_HINTS.join(', ')}.`,
        'The title must be a user-friendly spending name, not receipt header text and not a total amount.',
        'For supermarket or grocery receipts, use title "Grocery purchase".',
        'Do not use titles like "Tax Invoice", "Receipt", "$29.33", or "[expense] $29.33".',
        'For Australian receipts, ambiguous dates like 18/05/26 or 18-05-26 mean DD/MM/YY, so return 2026-05-18.',
        'Only use YYYY-MM-DD directly when the receipt clearly prints a four-digit year first.',
        'Also include rawDate with the exact date text seen on the receipt.',
        'If a value is unclear, use an empty string and lower confidence.',
      ].join(' '),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Read this receipt image and return JSON with merchant, title, description, amount, category, date as YYYY-MM-DD, rawDate, confidence 0-1, and items array of {name, amount}. Make title a concise purchase type such as Grocery purchase, Lunch, Fuel purchase, Pharmacy purchase, or Shopping purchase.',
            },
            {
              type: 'input_image',
              image_url: imageDataUrl,
              detail: 'high',
            },
          ],
        },
      ],
      text: { format: { type: 'json_object' } },
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = body?.error?.message || 'AI receipt parsing failed.'
    throw new Error(message)
  }

  const outputText = extractOutputText(body)
  return JSON.parse(outputText)
}

receiptsRouter.post('/parse', async (req, res) => {
  try {
    const imageDataUrl = String(req.body.imageDataUrl || '')
    if (!imageDataUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Please upload a receipt image.' })
    }
    if (imageDataUrl.length > 10_000_000) {
      return res.status(413).json({ error: 'Receipt image is too large. Please upload a smaller image.' })
    }

    const parsed = await parseReceiptWithOpenAI(imageDataUrl)
    res.json(cleanReceiptDraft(parsed))
  } catch (err) {
    res.status(500).json({ error: err.message || 'Receipt parsing failed.' })
  }
})
