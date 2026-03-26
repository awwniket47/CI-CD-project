import { NavLink } from 'react-router-dom'
import { Search, BookOpen, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getHealth } from '../api/client'

const nav = [
  { to: '/',          icon: Search,   label: 'Research'       },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
  { to: '/history',   icon: Clock,    label: 'History'        },
]

export default function Layout({ children }) {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null))
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>

      {/* ── Sidebar */}
      <aside style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #00e5a0 0%, #4d9fff 100%)',
              borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 16,
            }}>🛒</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.03em' }}>
                RetailResearcher
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>
                AI Agent v3.0
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{ fontSize: '0.62rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px 8px' }}>
            Navigation
          </div>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 3,
              fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
              background: isActive ? 'var(--surface3)' : 'transparent',
              color: isActive ? 'var(--green)' : 'var(--text2)',
              transition: 'all 0.15s',
            })}>
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Status footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
            SYSTEM STATUS
          </div>
          {health ? (
            <>
              <StatusRow label="Gemini API"   ok={health.gemini_configured} />
              <StatusRow label="Search"       value={health.search_tool ? 'DuckDuckGo' : '–'} />
              <StatusRow label="Vector DB"    value={health.vector_db || 'ChromaDB'} />
              <StatusRow label="Reports"      value={health.kb_reports_vector ?? 0} />
            </>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Connecting...</div>
          )}
        </div>
      </aside>

      {/* ── Main */}
      <main style={{ overflow: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}

function StatusRow({ label, ok, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{label}</span>
      {value !== undefined
        ? <span style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--green)' }}>{value}</span>
        : <span style={{ fontSize: '0.7rem', color: ok ? 'var(--green)' : 'var(--red)' }}>
            {ok ? '● Connected' : '○ Missing'}
          </span>
      }
    </div>
  )
}