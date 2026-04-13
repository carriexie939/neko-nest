// compute the split result for a bill
// totalAmount is the total amount of the bill
// participantCount is the number of participants
// mode is the mode of the split
// manualShares is an array of manual shares
// return the split result object
// the object has the following properties:
// - mode: 'manual' or 'auto'
// - totalAmount: number
// - shares: array of share objects
// - isValid: boolean
// if the split result is not found, return null or an empty object

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function computeSplit({ totalAmount, participantCount, mode, manualShares }) {
  const amount = toNumber(totalAmount)
  const count = Math.max(1, Math.floor(toNumber(participantCount)))
  const safeMode = mode === 'manual' ? 'manual' : 'auto'

  if (safeMode === 'manual') {
    const shares = Array.isArray(manualShares)
      ? manualShares.map((value, idx) => ({
          name: `P${idx + 1}`,
          amount: toNumber(value),
        }))
      : []
    const sum = shares.reduce((acc, row) => acc + row.amount, 0)
    return { mode: safeMode, totalAmount: amount, shares, isValid: Math.abs(sum - amount) < 0.01 }
  }

  const perHead = amount / count
  const shares = Array.from({ length: count }).map((_, idx) => ({
    name: `P${idx + 1}`,
    amount: perHead,
  }))
  return { mode: safeMode, totalAmount: amount, shares, isValid: true }
}
