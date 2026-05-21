import { useState } from 'react'
import { tokens } from '../theme/tokens'

/** Demo-only merchant portal: aggregated insights + coupon draft (no real API). */
const MOCK_CATEGORIES = [
  { category: 'food', amount: 12400, share: 28.2, trend: '+4%' },
  { category: 'shopping', amount: 9800, share: 22.3, trend: '+12%' },
  { category: 'transport', amount: 6100, share: 13.9, trend: '-2%' },
  { category: 'entertainment', amount: 5200, share: 11.8, trend: '+7%' },
  { category: 'bills', amount: 4800, share: 10.9, trend: '0%' },
]

const MOCK_BRANDS = [
  { brand: 'Starbucks', category: 'food', share: 8.1 },
  { brand: 'Amazon', category: 'shopping', share: 11.4 },
  { brand: 'Uber', category: 'transport', share: 6.2 },
  { brand: 'Netflix', category: 'entertainment', share: 4.5 },
  { brand: 'Whole Foods', category: 'food', share: 5.3 },
]

const card = {
  background: tokens.color.panel,
  borderRadius: tokens.radius.lg,
  border: `1px solid ${tokens.color.border}`,
  boxShadow: tokens.shadow.soft,
  padding: tokens.spacing.lg,
  marginBottom: tokens.spacing.md,
}

const numStyle = { fontWeight: 800, color: '#1e3a5f' }

export function MerchantPortalView({ onExit }) {
  const [couponTitle, setCouponTitle] = useState('10% off food & dining')
  const [couponCategory, setCouponCategory] = useState('food')
  const [couponSent, setCouponSent] = useState(false)

  const maxCat = MOCK_CATEGORIES[0]?.amount || 1

  return (
    <div
      style={{
        minHeight: '100vh',
        background: tokens.color.bg,
        color: tokens.color.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 48px' }}>
        <header style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: tokens.color.subtext, textTransform: 'uppercase' }}>
              Partner portal
            </p>
            <h1 style={{ margin: '4px 0 6px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Merchant insights
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: tokens.color.subtext, lineHeight: 1.45 }}>
              Aggregated spending patterns from opted-in NekoNest users (demo data).
            </p>
          </div>
          <button type="button" className="btn-ghost" style={{ flexShrink: 0, marginTop: 4 }} onClick={onExit}>
            Exit demo
          </button>
        </header>

        <div style={{ ...card, background: '#f8fafc', borderColor: '#cbd5e1' }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: tokens.color.subtext }}>
            <strong style={{ color: tokens.color.text }}>Privacy:</strong> merchants only see cohort-level stats (min. 50 users). No individual accounts or transaction lists in this view.
          </p>
        </div>

        <div style={card}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>Where users spend most</h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: tokens.color.subtext }}>Last 30 days · opted-in cohort · n≈1,240</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_CATEGORIES.map((row) => {
              const pct = Math.max((row.amount / maxCat) * 100, 10)
              return (
                <div key={row.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{row.category}</span>
                    <span>
                      <span style={numStyle}>${(row.amount / 1000).toFixed(1)}k</span>
                      <span style={{ color: tokens.color.subtext, marginLeft: 8 }}>{row.share}%</span>
                      <span style={{ marginLeft: 8, fontSize: 11, color: row.trend.startsWith('+') ? '#15803d' : tokens.color.subtext }}>
                        {row.trend}
                      </span>
                    </span>
                  </div>
                  <div style={{ height: 10, background: '#f5f5f0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6', borderRadius: 999 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={card}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>Top brands & merchants</h2>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: tokens.color.subtext }}>Inferred from merchant names · demo rollup</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {MOCK_BRANDS.map((row, i) => (
              <li
                key={row.brand}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < MOCK_BRANDS.length - 1 ? `1px solid ${tokens.color.border}` : 'none',
                  fontSize: 13,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{row.brand}</div>
                  <div style={{ fontSize: 11, color: tokens.color.subtext, textTransform: 'capitalize' }}>{row.category}</div>
                </div>
                <span style={numStyle}>{row.share}% of cohort spend</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={card}>
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>Issue coupon</h2>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: tokens.color.subtext }}>
            Offer title
          </label>
          <input
            value={couponTitle}
            onChange={(e) => setCouponTitle(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 999,
              border: `1.5px solid ${tokens.color.border}`,
              marginBottom: 12,
              fontSize: 15,
            }}
          />
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: tokens.color.subtext }}>
            Target category
          </label>
          <select
            value={couponCategory}
            onChange={(e) => setCouponCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: tokens.radius.sm,
              border: `1.5px solid ${tokens.color.border}`,
              marginBottom: 16,
              fontSize: 15,
              background: tokens.color.panel,
            }}
          >
            {MOCK_CATEGORIES.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-action"
            style={{ width: '100%' }}
            onClick={() => setCouponSent(true)}
          >
            Publish to opted-in users (demo)
          </button>
          {couponSent ? (
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#15803d', fontWeight: 600 }}>
              Demo: coupon &quot;{couponTitle}&quot; queued for users with high {couponCategory} spend.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
