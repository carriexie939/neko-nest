import { useEffect, useState } from 'react'
import { topSpendingCategories } from '../domain/summary'
import { fetchMonthlyTrends } from '../utils/api'
import { tokens } from '../theme/tokens'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function InsightsView({
  weeklySummary,
  monthlySummary,
  insightRange,
  setInsightRange,
  weeklyBudget,
}) {
  const [trends, setTrends] = useState([])
  const [showMock, setShowMock] = useState(false)
  const [showCatMock, setShowCatMock] = useState(false)

  useEffect(() => {
    fetchMonthlyTrends()
      .then(setTrends)
      .catch(() => setTrends([]))
  }, [])

  const MOCK_12 = [
    { year: 2025, month: 5, total: 820 },
    { year: 2025, month: 6, total: 1150 },
    { year: 2025, month: 7, total: 960 },
    { year: 2025, month: 8, total: 1380 },
    { year: 2025, month: 9, total: 720 },
    { year: 2025, month: 10, total: 1050 },
    { year: 2025, month: 11, total: 890 },
    { year: 2025, month: 12, total: 1420 },
    { year: 2026, month: 1, total: 780 },
    { year: 2026, month: 2, total: 650 },
    { year: 2026, month: 3, total: 1100 },
    { year: 2026, month: 4, total: 690 },
  ]
  const displayTrends = showMock ? MOCK_12 : trends

  const activeSummary = insightRange === 'week' ? weeklySummary : monthlySummary
  const top3 = topSpendingCategories(activeSummary, 3)

  return (
    <section>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Summary</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            type="button"
            className={insightRange === 'week' ? 'btn-action' : 'btn-ghost'}
            onClick={() => setInsightRange('week')}
          >
            Weekly
          </button>
          <button
            type="button"
            className={insightRange === 'month' ? 'btn-action' : 'btn-ghost'}
            onClick={() => setInsightRange('month')}
          >
            Monthly
          </button>
        </div>
        <p style={{ margin: '4px 0' }}>Budget target (weekly): <span style={numStyle}>${weeklyBudget.toFixed(2)}</span></p>
        <p style={{ margin: '4px 0' }}>Income: <span style={numStyle}>${activeSummary.income.toFixed(2)}</span></p>
        <p style={{ margin: '4px 0' }}>Expense: <span style={numStyle}>${activeSummary.expense.toFixed(2)}</span></p>
        <p style={{ margin: '4px 0' }}>Balance: <span style={numStyle}>${activeSummary.balance.toFixed(2)}</span></p>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Monthly Expenditure Trends</h3>
          <button type="button" className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setShowMock((s) => !s)}>
            {showMock ? 'Real data' : 'Demo 12mo'}
          </button>
        </div>
        {displayTrends.length === 0 ? (
          <p style={{ margin: '8px 0 0', color: tokens.color.subtext }}>No trend data yet.</p>
        ) : (
          <TrendPieChart trends={displayTrends} />
        )}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Category Breakdown</h3>
          <button type="button" className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setShowCatMock((s) => !s)}>
            {showCatMock ? 'Real data' : 'Demo 10'}
          </button>
        </div>
        {(() => {
          const MOCK_CATS = [
            { category: 'food', amount: 520, percentage: 22.1 },
            { category: 'transport', amount: 310, percentage: 13.2 },
            { category: 'housing', amount: 480, percentage: 20.4 },
            { category: 'shopping', amount: 180, percentage: 7.7 },
            { category: 'entertainment', amount: 150, percentage: 6.4 },
            { category: 'education', amount: 200, percentage: 8.5 },
            { category: 'healthcare', amount: 130, percentage: 5.5 },
            { category: 'bills', amount: 220, percentage: 9.4 },
            { category: 'travel', amount: 95, percentage: 4.0 },
            { category: 'others', amount: 65, percentage: 2.8 },
          ]
          const catData = showCatMock ? MOCK_CATS : activeSummary.byCategory
          return catData.length === 0 ? (
            <p style={{ margin: '8px 0 0', color: tokens.color.subtext }}>No expense data in this range.</p>
          ) : (
            <div style={{ ...catGrid, marginTop: 8 }}>
              {catData.map((row, i) => (
                <div key={row.category} style={catCard}>
                  <div style={{ ...catIcon, background: PIE_COLORS[i % PIE_COLORS.length] }}>
                    {CAT_ICONS[row.category] || '📦'}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: tokens.color.text, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.category}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e3a5f', marginTop: 1 }}>
                    ${row.amount.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 10, color: tokens.color.subtext, marginTop: 1 }}>
                    {row.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Top 3 Spending Categories</h3>
        {top3.length === 0 ? (
          <p style={{ margin: 0, color: tokens.color.subtext }}>No data yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {top3.map((row, i) => {
              const maxAmount = top3[0].amount || 1
              const pct = Math.max((row.amount / maxAmount) * 100, 8)
              return (
                <div key={row.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: tokens.color.text }}>
                      #{i + 1} {row.category}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1e3a5f' }}>
                      ${row.amount.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 14, background: '#f5f5f0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 999 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

const PIE_COLORS = [
  '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa',
  '#93c5fd', '#bfdbfe', '#0d9488', '#14b8a6',
  '#5eead4', '#ca8a04', '#eab308', '#fde047',
]

function TrendPieChart({ trends }) {
  const total = trends.reduce((s, t) => s + t.total, 0)
  if (total === 0) return null

  const R = 44
  const CX = 50
  const CY = 50
  let cumAngle = -Math.PI / 2

  const slices = []
  const labels = []

  trends.forEach((t, i) => {
    const fraction = t.total / total
    const startAngle = cumAngle
    const endAngle = cumAngle + fraction * Math.PI * 2
    cumAngle = endAngle

    const x1 = CX + R * Math.cos(startAngle)
    const y1 = CY + R * Math.sin(startAngle)
    const x2 = CX + R * Math.cos(endAngle)
    const y2 = CY + R * Math.sin(endAngle)
    const largeArc = fraction > 0.5 ? 1 : 0
    const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`

    slices.push(
      <path key={`slice-${t.year}-${t.month}`} d={d} fill={PIE_COLORS[i % PIE_COLORS.length]} />
    )

    if (fraction >= 0.04) {
      const midAngle = (startAngle + endAngle) / 2
      const labelR = R * 0.62
      const lx = CX + labelR * Math.cos(midAngle)
      const ly = CY + labelR * Math.sin(midAngle)
      labels.push(
        <text
          key={`pct-${t.year}-${t.month}`}
          x={lx}
          y={ly}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="5"
          fontWeight="700"
          fill="#fff"
        >
          {(fraction * 100).toFixed(0)}%
        </text>
      )
    }
  })

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 100 100" width="180" height="180">
          {slices}
          {labels}
        </svg>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 10, justifyContent: 'center' }}>
        {trends.map((t, i) => {
          const pct = ((t.total / total) * 100).toFixed(1)
          return (
            <div key={`leg-${t.year}-${t.month}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
              <span style={{ color: tokens.color.subtext }}>
                {MONTH_NAMES[t.month - 1]} <strong style={{ color: '#1e3a5f' }}>${t.total.toFixed(0)}</strong> ({pct}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CAT_ICONS = {
  food: '🍔',
  transport: '🚌',
  housing: '🏠',
  shopping: '🛍️',
  entertainment: '🎮',
  education: '📚',
  healthcare: '💊',
  bills: '📄',
  travel: '✈️',
  others: '📦',
  salary: '💰',
  freelance: '💻',
  bonus: '🎁',
  gift: '🎀',
  other_income: '💵',
}

const numStyle = {
  fontWeight: 800,
  color: '#1e3a5f',
}

const card = {
  background: '#eef4fb',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  padding: 14,
  marginBottom: 12,
  boxShadow: tokens.shadow.soft,
}

const catGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 6,
}

const catCard = {
  background: '#fff',
  borderRadius: 10,
  padding: '8px 4px',
  textAlign: 'center',
  border: `1px solid ${tokens.color.border}`,
}

const catIcon = {
  width: 26,
  height: 26,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  margin: '0 auto',
}

