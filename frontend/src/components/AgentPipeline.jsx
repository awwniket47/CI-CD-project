// src/components/AgentPipeline.jsx — Live agent pipeline (DuckDuckGo version)

const AGENTS = [
  { icon: '🔍', label: 'Researcher',  desc: 'Searching via DuckDuckGo' },
  { icon: '🧠', label: 'Analyst',     desc: 'Extracting key insights'   },
  { icon: '✍️',  label: 'Writer',      desc: 'Writing research report'   },
  { icon: '💾', label: 'Knowledge',   desc: 'Saving to ChromaDB'        },
]

export default function AgentPipeline({ currentStep, status, logs }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 24, marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Agent Pipeline</div>
        <StatusBadge status={status} />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {AGENTS.map((agent, i) => {
          const isDone   = currentStep > i
          const isActive = currentStep === i
          const isIdle   = currentStep < i

          return (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                {/* Circle */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', margin: '0 auto 10px',
                  display: 'grid', placeItems: 'center', fontSize: 20,
                  background: isDone ? 'rgba(0,229,160,0.12)' : isActive ? 'rgba(77,159,255,0.12)' : 'var(--surface2)',
                  border: `2px solid ${isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'var(--border)'}`,
                  transition: 'all 0.3s', opacity: isIdle ? 0.45 : 1, position: 'relative',
                }}>
                  {isActive && status === 'running' && (
                    <div style={{
                      position: 'absolute', inset: -4, borderRadius: '50%',
                      border: '2px solid var(--blue)', borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite',
                    }} />
                  )}
                  {agent.icon}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'var(--text3)', marginBottom: 3 }}>
                  {agent.label}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text3)', lineHeight: 1.4 }}>
                  {agent.desc}
                </div>
                {isDone && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--green)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                    ✓ done
                  </div>
                )}
              </div>
              {i < AGENTS.length - 1 && (
                <div style={{ padding: '26px 4px 0', color: isDone ? 'var(--green)' : 'var(--border2)', fontSize: '1.1rem', transition: 'color 0.3s' }}>
                  →
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Live log */}
      {logs && logs.length > 0 && (
        <div style={{ marginTop: 20, background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px', maxHeight: 140, overflowY: 'auto' }}>
          {logs.slice(-8).map((line, i) => (
            <div key={i} style={{
              fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace",
              color: i === logs.slice(-8).length - 1 ? 'var(--green)' : 'var(--text3)',
              lineHeight: 1.6,
            }}>
              {line}
              {i === logs.slice(-8).length - 1 && status === 'running' && (
                <span className="animate-blink" style={{ marginLeft: 2 }}>▊</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'Pending',   color: 'var(--text3)', bg: 'var(--surface2)' },
    running:   { label: 'Running',   color: 'var(--blue)',  bg: 'rgba(77,159,255,0.1)' },
    completed: { label: 'Completed', color: 'var(--green)', bg: 'rgba(0,229,160,0.1)' },
    failed:    { label: 'Failed',    color: 'var(--red)',   bg: 'rgba(255,85,102,0.1)' },
  }
  const s = map[status] || map.pending
  return (
    <div style={{
      padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
      color: s.color, background: s.bg,
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {status === 'running' && (
        <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
      )}
      {s.label}
    </div>
  )
}