import { tokens } from '../theme/tokens'

export function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(180deg, rgba(241,238,232,0) 0%, #f0ece5 28%)',
        backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${tokens.color.border}`,
        zIndex: 50,
      }}
      aria-label="Main"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            style={{
              flex: 1,
              maxWidth: 140,
              padding: '10px 8px',
              borderRadius: 14,
              border: active ? '2px solid #3b82c4' : `1px solid ${tokens.color.border}`,
              background: active ? '#fff' : 'rgba(255,255,255,0.7)',
              fontWeight: 700,
              fontSize: 12,
              color: tokens.color.text,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              boxShadow: active ? tokens.shadow.soft : 'none',
            }}
            onClick={() => onTabChange(tab.id)}
            aria-current={active ? 'page' : undefined}
          >
            <span aria-hidden style={{ fontSize: 18 }}>
              {tab.emoji}
            </span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
