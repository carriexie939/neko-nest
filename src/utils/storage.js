const STORAGE_KEY = 'cookieNotes:v1'

const DEFAULT_STATE = {
  version: 1,
  transactions: [],
  weeklyBudget: 300,
}

function normalizeTransaction(tx) {
  return {
    id: String(tx?.id || crypto.randomUUID()),
    type: tx?.type === 'income' ? 'income' : 'expense',
    category: String(tx?.category || 'others'),
    amount: Number(tx?.amount) || 0,
    date: new Date(tx?.date || Date.now()).toISOString(),
    source: tx?.source || 'manual',
  }
}

export function migratePersistedState(rawParsed) {
  if (!rawParsed || typeof rawParsed !== 'object') return DEFAULT_STATE
  const version = Number(rawParsed.version) || 1
  return {
    version,
    transactions: Array.isArray(rawParsed.transactions)
      ? rawParsed.transactions.map(normalizeTransaction)
      : [],
    weeklyBudget:
      Number(rawParsed.weeklyBudget) > 0
        ? Number(rawParsed.weeklyBudget)
        : DEFAULT_STATE.weeklyBudget,
  }
}

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return migratePersistedState(JSON.parse(raw))
  } catch {
    return DEFAULT_STATE
  }
}

export function savePersistedState(transactions, weeklyBudget) {
  try {
    const payload = JSON.stringify({
      version: 1,
      transactions: Array.isArray(transactions)
        ? transactions.map(normalizeTransaction)
        : [],
      weeklyBudget: Number(weeklyBudget) || DEFAULT_STATE.weeklyBudget,
    })
    localStorage.setItem(STORAGE_KEY, payload)
  } catch {
    // Ignore persistence errors (e.g. private mode quota).
  }
}

export function importTransactions(rawRows = []) {
  const errors = []
  const transactions = rawRows
    .map((row, index) => {
      const candidate = normalizeTransaction({
        id: row?.id || `import-${index}-${Date.now()}`,
        type: row?.type,
        category: row?.category,
        amount: row?.amount,
        date: row?.date,
        source: 'import',
      })
      if (candidate.amount <= 0) {
        errors.push({ index, reason: 'amount must be greater than zero' })
      }
      return candidate
    })
    .filter((tx) => tx.amount > 0)

  return { transactions, errors }
}
