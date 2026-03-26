// src/pages/HistoryPage.jsx — Past research sessions
import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react'
import { getSessions, getSession } from '../api/client'
import ReportViewer from '../components/ReportViewer.jsx'

const STATUS_CONFIG = {
  completed: { icon: <CheckCircle size={14} />, color: 'var(--green)',  label: 'Completed' },
  running:   { icon: <Loader size={14} />,       color: 'var(--blue)',   label: 'Running'   },
  pending:   { icon: <Loader size={14} />,        color: 'var(--text3)', label: 'Pending'   },
  failed:    { icon: <XCircle size={14} />,       color: 'var(--red)',   label: 'Failed'    },
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)   // session_id with full data
  const [fullData, setFullData] = useState({})

  const load = () => {
    setLoading(true)
    getSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggle = async (sessionId) => {
    if (expanded === sessionId) { setExpanded(null); return }
    setExpanded(sessionId)
    if (!fullData[sessionId]) {
      const data = await getSession(sessionId).catch(() => null)
      if (data) setFullData(prev => ({ ...prev, [sessionId]: data }))
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>

      <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>
            Research History
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            All research sessions from this server instance.
          </p>
        </div>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text2)', fontSize: '0.8rem', cursor: 'pointer',
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 68, borderRadius: 10 }} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🕐</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No sessions yet</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
            Go to Research to start your first session.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {sessions.slice().reverse().map(s => {
            const cfg     = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending
            const isOpen  = expanded === s.session_id
            const data    = fullData[s.session_id]

            return (
              <div key={s.session_id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s',
              }}>
                {/* Row header */}
                <div
                  onClick={() => toggle(s.session_id)}
                  style={{
                    padding: '14px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: cfg.color, flexShrink: 0,
                  }} />

                  {/* Query */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>
                      {s.query}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.68rem', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>
                      <span>{s.started_at?.replace('T', ' ').slice(0, 16)} UTC</span>
                      {s.elapsed_seconds && <span>⏱ {s.elapsed_seconds}s</span>}
                      <span style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </div>

                  {/* Expand chevron */}
                  <span style={{ color: 'var(--text3)', fontSize: '0.8rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                    ▾
                  </span>
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '20px' }}>
                    {data ? (
                      data.report ? (
                        <ReportViewer
                          report={data.report}
                          query={data.query}
                          filePath={data.file_path}
                          elapsed={data.elapsed_seconds}
                        />
                      ) : data.status === 'failed' ? (
                        <div style={{ color: 'var(--red)', fontSize: '0.875rem', padding: 12, background: 'rgba(255,85,102,0.07)', borderRadius: 8 }}>
                          ❌ {data.error || 'Research failed'}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>
                          Research is still {data.status}...
                        </div>
                      )
                    ) : (
                      <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
                    )}

                    {/* Log lines */}
                    {data?.log_lines?.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Agent Log
                        </div>
                        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', maxHeight: 120, overflowY: 'auto' }}>
                          {data.log_lines.map((l, i) => (
                            <div key={i} style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text3)', lineHeight: 1.6 }}>
                              {l}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}