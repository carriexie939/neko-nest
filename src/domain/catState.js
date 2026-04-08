export const CAT_STATES = {
  WELCOME: 'welcome',
  IDLE: 'idle',
  HAPPY: 'happy',
  SHOCKED: 'shocked',
  ANGRY: 'angry',
}

/**
 * Priority (most severe first):
 * 1. WELCOME  — no transactions
 * 2. ANGRY    — expense > income AND deficit > 50% of weeklyBudget
 * 3. SHOCKED  — weekly expense > weeklyBudget
 * 4. HAPPY    — income > expense
 * 5. IDLE     — everything else (balanced or minor deficit)
 */
export function evaluateCatState({ summary, transactions, weeklyBudget = 300 }) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return CAT_STATES.WELCOME
  }

  const income = Number(summary?.income) || 0
  const expense = Number(summary?.expense) || 0
  const deficit = expense - income

  if (deficit > 0 && deficit > weeklyBudget * 0.5) {
    return CAT_STATES.ANGRY
  }

  if (expense > weeklyBudget) {
    return CAT_STATES.SHOCKED
  }

  if (income > expense) {
    return CAT_STATES.HAPPY
  }

  return CAT_STATES.IDLE
}

export function getCatMoodCopy(state) {
  const map = {
    [CAT_STATES.WELCOME]: 'Hi there! I am your little companion. Start tracking to care for me!',
    [CAT_STATES.IDLE]: 'Yawn... Steady and calm. We are in balance today.',
    [CAT_STATES.HAPPY]: 'Love it! You are saving well and I feel great!',
    [CAT_STATES.SHOCKED]: 'Whoa! Spending went over budget this week!',
    [CAT_STATES.ANGRY]: 'Grr! We are seriously overspending. Let us cut back!',
  }
  return map[state] || map[CAT_STATES.IDLE]
}

export function getCatMoodLabel(state) {
  const map = {
    [CAT_STATES.WELCOME]: 'Welcome',
    [CAT_STATES.IDLE]: 'Relaxed',
    [CAT_STATES.HAPPY]: 'Happy',
    [CAT_STATES.SHOCKED]: 'Shocked',
    [CAT_STATES.ANGRY]: 'Angry',
  }
  return map[state] || 'Idle'
}
