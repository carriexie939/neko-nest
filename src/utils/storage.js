const STORAGE_KEY = 'cookieNotes:v1'

// default state
const DEFAULT_STATE = {
  version: 1,
  transactions: [],
  weeklyBudget: 300,
}

// normalize a transaction object
// tx is a transaction object
// return the normalized transaction object
// the object has the following properties:
// - id: string
// - type: 'income' or 'expense'
// - category: string
// - amount: number
// - date: string
// - source: 'manual' or 'split'
// if the transaction is not found, return null or an empty object
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

// migrate persisted state
// rawParsed is a parsed object
// return the migrated state object
// the object has the following properties:
// - version: number
// - transactions: array of transaction objects
// - weeklyBudget: number
// if the state is not found, return null or an empty object
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

// load persisted state
// return the persisted state object
// the object has the following properties:
// - version: number
// - transactions: array of transaction objects
// - weeklyBudget: number
// if the state is not found, return null or an empty object
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

// import transactions
// rawRows is an array of raw rows
// each row is a transaction object
// return the transactions array and errors array
// the transactions array has the following properties:
// - id: string
// - type: 'income' or 'expense'
// - category: string
// - amount: number
// - date: string
// - source: 'manual' or 'split'
// the errors array has the following properties:
// - index: number
// - reason: string
// if the transactions are not found, return null or an empty array
// if the errors are not found, return null or an empty array
// if the rawRows is not found, return null or an empty array
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
