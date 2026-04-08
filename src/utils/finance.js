import { computeSummary } from '../domain/summary'

export function computeWeeklySummary(transactions = [], budget = {}) {
  const summary = computeSummary(transactions, {
    range: 'week',
    weeklyBudget: budget.weeklyBudget,
    now: budget.weekStart || new Date(),
  })

  return {
    income: summary.income,
    expense: summary.expense,
    net: summary.balance,
    remaining: summary.remaining,
    mood: summary.balance > 0 ? 'happy' : summary.balance < 0 ? 'sad' : 'neutral',
    transactionCount: summary.transactionCount,
  }
}
