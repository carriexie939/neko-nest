
import { computeSummary } from '../domain/summary'

export function computeWeeklySummary(transactions = [], budget = {}) {
  const summary = computeSummary(transactions, {
    range: 'week',
    weeklyBudget: budget.weeklyBudget,
    now: budget.weekStart || new Date(),
  })
// return the weekly summary object
// the object has the following properties:
// - income: number
// - expense: number
// - net: number
// - remaining: number
// - mood: string
// - transactionCount: number
// if the summary is not found, return null or an empty object
  return {
    income: summary.income,
    expense: summary.expense,
    net: summary.balance,
    remaining: summary.remaining,
    // 结余生成的简单心情标签，与猫咪视频的 catState 逻辑无关
    mood: summary.balance > 0 ? 'happy' : summary.balance < 0 ? 'sad' : 'neutral',
    transactionCount: summary.transactionCount,
  }
}
