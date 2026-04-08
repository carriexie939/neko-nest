function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function getRangeBoundary(range = 'week', now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)

  if (range === 'month') {
    start.setDate(1)
    end.setMonth(start.getMonth() + 1, 1)
    return { start, end }
  }

  const day = start.getDay()
  const diffToMonday = (day + 6) % 7
  start.setDate(start.getDate() - diffToMonday)
  end.setDate(start.getDate() + 7)
  return { start, end }
}

export function computeSummary(transactions = [], options = {}) {
  const range = options.range || 'week'
  const weeklyBudget = toNumber(options.weeklyBudget)
  const now = options.now || new Date()
  const { start, end } = getRangeBoundary(range, now)

  const inRange = transactions.filter((tx) => {
    const when = new Date(tx.date)
    return Number.isFinite(when.getTime()) && when >= start && when < end
  })

  const income = inRange
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + toNumber(tx.amount), 0)
  const expense = inRange
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + toNumber(tx.amount), 0)
  const balance = income - expense
  const remaining = income - expense

  return {
    range,
    start: start.toISOString(),
    end: end.toISOString(),
    income,
    expense,
    balance,
    remaining,
    weeklyBudget,
    transactionCount: inRange.length,
    byCategory: buildCategoryBreakdown(inRange, 'expense'),
  }
}

export function buildCategoryBreakdown(transactions = [], type = 'expense') {
  const bucket = new Map()
  transactions
    .filter((tx) => tx.type === type)
    .forEach((tx) => {
      const key = String(tx.category || 'others')
      bucket.set(key, (bucket.get(key) || 0) + toNumber(tx.amount))
    })

  const total = Array.from(bucket.values()).reduce((sum, value) => sum + value, 0)
  return Array.from(bucket.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function topSpendingCategories(summary, limit = 3) {
  return (summary?.byCategory || []).slice(0, limit)
}
