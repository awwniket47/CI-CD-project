// src/pages/ResearchPage.jsx
import { useState, useRef, useEffect } from 'react'
import { Search, ArrowRight, Sparkles, TrendingUp, ShoppingCart, BarChart2, Cpu, Users } from 'lucide-react'
import { startResearch, getSession, createEventSource } from '../api/client'
import AgentPipeline from '../components/AgentPipeline.jsx'
import ReportViewer from '../components/ReportViewer.jsx'

const EXAMPLE_QUERIES = [
  { icon: <Cpu size={14} />,          text: 'How is AI transforming retail inventory management?' },
  { icon: <TrendingUp size={14} />,   text: 'Latest e-commerce trends in India 2025'              },
  { icon: <ShoppingCart size={14} />, text: 'Impact of quick commerce on traditional retail'      },
  { icon: <BarChart2 size={14} />,    text: 'How Amazon uses AI in its supply chain'              },
  { icon: <Users size={14} />,        text: 'Customer behaviour changes in retail post-2023'      },
  { icon: <Sparkles size={14} />,     text: 'Retail automation technologies and their ROI'        },
]

export default function ResearchPage() {
  const [query, setQuery]         = useState('')
  const [status, setStatus]       = useState('idle')
  const [currentStep, setCurrent] = useState(-1)
  const [logs, setLogs]           = useState([])
  const [report, setReport]       = useState(null)
  const [filePath, setFilePath]   = useState(null)
  const [elapsed, setElapsed]     = useState(null)
  const [error, setError]         = useState(null)

  const esRef        = useRef(null)
  const sessionIdRef = useRef(null)
  const intervalRef  = useRef(null)
  const isActiveRef  = useRef(false) // tracks if polling should continue

  // cleanup on unmount
  useEffect(() => () => {
    esRef.current?.close()
    clearInterval(intervalRef.current)
  }, [])

  const stopPolling = () => {
    isActiveRef.current = false
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  const startPolling = (session_id) => {
    isActiveRef.current = true
    intervalRef.current = setInterval(async () => {
      if (!isActiveRef.current) {
        stopPolling()
        return
      }
      try {
        const data = await getSession(session_id)

        if (typeof data.current_step === 'number' && data.current_step >= 0) {
          setCurrent(data.current_step)
        }
        if (data.log_lines?.length) {
          setLogs(data.log_lines)
        }

        // stop polling once done
        if (data.status === 'completed' || data.status === 'failed') {
          stopPolling()
        }
      } catch (_) {
        stopPolling()
      }
    }, 1500)
  }

  const handleSubmit = async () => {
    if (!query.trim() || status === 'running' || status === 'pending') return
    reset()
    setStatus('pending')

    try {
      const { session_id } = await startResearch(query.trim())
      sessionIdRef.current = session_id
      startPolling(session_id)

      const es = createEventSource(session_id)
      esRef.current = es

      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)

          if (msg.event === 'step') {
            const step = typeof msg.step === 'number' ? msg.step : parseInt(msg.step)
            setStatus(msg.status || 'running')
            setCurrent(step)
          }

          if (msg.event === 'log') {
            setLogs(prev => [...prev, msg.message])
          }

          if (msg.event === 'completed') {
            setElapsed(msg.elapsed)
            setStatus('completed')
            setCurrent(4) // all steps done
            stopPolling()
            es.close()
            getSession(session_id).then(data => {
              setReport(data.report)
              setFilePath(data.file_path)
            })
          }

          if (msg.event === 'failed') {
            setStatus('failed')
            setError(msg.error)
            stopPolling()
            es.close()
          }
        } catch (parseErr) {
          console.error('SSE parse error:', parseErr)
        }
      }

      es.onerror = () => {
        setStatus('failed')
        setError('Connection to agent stream lost.')
        stopPolling()
        es.close()
      }

    } catch (err) {
      setStatus('failed')
      setError(err.response?.data?.detail || err.message)
      stopPolling()
    }
  }

  const reset = () => {
    esRef.current?.close()
    stopPolling()
    sessionIdRef.current = null
    setStatus('idle'); setCurrent(-1); setLogs([])
    setReport(null); setFilePath(null); setElapsed(null); setError(null)
  }

  const isActive = status === 'running' || status === 'pending'

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>

      {/* Hero */}
      <div className="animate-fade-up" style={{ marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--green)', background: 'rgba(0,229,160,0.08)',
          border: '1px solid rgba(0,229,160,0.2)', borderRadius: 20,
          padding: '4px 12px', marginBottom: 16,
        }}>
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          Gemini · Tavily · CrewAI · ChromaDB
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 12 }}>
          Autonomous Retail<br />
          <span style={{ background: 'linear-gradient(90deg, var(--green), var(--blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Research Agent
          </span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: 520 }}>
          Ask any retail industry question. Three AI agents search Tavily,
          extract insights, and write a report — saved to ChromaDB and your knowledge base.
        </p>
      </div>

      {/* Search box */}
      <div className="animate-fade-up" style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          border: `1px solid ${isActive ? 'rgba(77,159,255,0.5)' : 'var(--border)'}`,
          borderRadius: 12, transition: 'border-color 0.2s',
          boxShadow: isActive ? '0 0 0 3px rgba(77,159,255,0.08)' : 'none',
        }}>
          <div style={{ padding: '0 16px', display: 'grid', placeItems: 'center', color: 'var(--text3)' }}>
            <Search size={18} />
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. How is AI used in retail inventory management?"
            disabled={isActive}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              padding: '16px 0', fontSize: '0.975rem', color: 'var(--text)',
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={isActive || !query.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 22px', margin: 5,
              background: isActive ? 'var(--surface2)' : 'var(--green)',
              color: isActive ? 'var(--text3)' : '#000',
              border: 'none', borderRadius: 8,
              fontSize: '0.875rem', fontWeight: 700,
              cursor: isActive ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', fontFamily: "'Bricolage Grotesque', sans-serif",
              opacity: (!query.trim() && !isActive) ? 0.5 : 1,
            }}
          >
            {isActive ? (
              <>
                <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid var(--text3)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                Researching
              </>
            ) : (
              <><ArrowRight size={14} /> Research</>
            )}
          </button>
        </div>
      </div>

      {/* Example queries */}
      {status === 'idle' && (
        <div className="animate-fade-up" style={{ marginBottom: 36 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>
            TRY AN EXAMPLE
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLE_QUERIES.map((q, i) => (
              <button key={i} onClick={() => setQuery(q.text)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text2)', fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.15s', fontFamily: "'Bricolage Grotesque', sans-serif",
              }}>
                <span style={{ color: 'var(--text3)' }}>{q.icon}</span>
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline */}
      {(isActive || status === 'completed' || status === 'failed') && (
        <AgentPipeline currentStep={currentStep} status={status} logs={logs} />
      )}

      {/* Error */}
      {status === 'failed' && error && (
        <div style={{
          background: 'rgba(255,85,102,0.08)', border: '1px solid rgba(255,85,102,0.3)',
          borderRadius: 10, padding: '16px 20px', marginBottom: 20,
          color: 'var(--red)', fontSize: '0.875rem',
        }}>
          <strong>Research failed:</strong> {error}
          <br />
          <button onClick={reset} style={{ marginTop: 8, color: 'var(--text2)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Try again
          </button>
        </div>
      )}

      {/* Report */}
      {report && (
        <ReportViewer report={report} query={query} filePath={filePath} elapsed={elapsed} />
      )}
    </div>
  )
}