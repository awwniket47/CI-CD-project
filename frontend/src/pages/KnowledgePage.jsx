// src/pages/KnowledgePage.jsx — ChromaDB semantic + keyword search
import { useState, useEffect } from 'react'
import { Search, FileText, Calendar, Hash, Zap, BookOpen } from 'lucide-react'
import { getKnowledge, getKnowledgeStats, semanticSearch, keywordSearch } from '../api/client'
import ReportViewer from '../components/ReportViewer.jsx'

export default function KnowledgePage() {
  const [reports, setReports]       = useState([])
  const [stats, setStats]           = useState(null)
  const [searchQ, setSearchQ]       = useState('')
  const [searchMode, setMode]       = useState('semantic') // 'semantic' | 'keyword'
  const [searchResults, setResults] = useState(null)
  const [selected, setSelected]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [searching, setSearching]   = useState(false)

  useEffect(() => {
    Promise.all([getKnowledge(), getKnowledgeStats()])
      .then(([rpts, st]) => { setReports(rpts); setStats(st) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async () => {
    if (!searchQ.trim()) { setResults(null); return }
    setSearching(true)
    try {
      const data = searchMode === 'semantic'
        ? await semanticSearch(searchQ.trim())
        : await keywordSearch(searchQ.trim())
      setResults(data)
    } finally {
      setSearching(false)
    }
  }

  const displayList = searchResults ? searchResults.results : reports

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>
          Knowledge Base
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
          Reports stored in ChromaDB (vector) + .txt files (backup).
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          <StatCard icon={<Zap size={14} />}      label="Vector Reports" value={stats.total_reports_vector} color="var(--green)" />
          <StatCard icon={<FileText size={14} />}  label="TXT Backups"    value={stats.total_reports_txt}    color="var(--blue)" />
          <StatCard icon={<BookOpen size={14} />}  label="Search Mode"    value="ChromaDB"                   color="var(--amber)" small />
          <StatCard icon={<Hash size={14} />}      label="Embeddings"     value="all-MiniLM-L6-v2"           color="var(--text2)" small />
        </div>
      )}

      {/* Search */}
      <div className="animate-fade-up" style={{ marginBottom: 24 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {['semantic', 'keyword'].map(mode => (
            <button key={mode} onClick={() => setMode(mode)} style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)',
              background: searchMode === mode ? 'var(--green)' : 'var(--surface)',
              color: searchMode === mode ? '#000' : 'var(--text2)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}>
              {mode === 'semantic' ? '⚡ Semantic Search' : '🔤 Keyword Search'}
            </button>
          ))}
          <span style={{ fontSize: '0.75rem', color: 'var(--text3)', alignSelf: 'center', marginLeft: 4 }}>
            {searchMode === 'semantic' ? 'Finds conceptually similar reports via ChromaDB' : 'Exact keyword match in .txt files'}
          </span>
        </div>

        <div style={{
          display: 'flex', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{ padding: '0 14px', display: 'grid', placeItems: 'center', color: 'var(--text3)' }}>
            <Search size={16} />
          </div>
          <input
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); if (!e.target.value) setResults(null) }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={searchMode === 'semantic' ? 'e.g. AI in inventory management...' : 'Enter exact keyword...'}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              padding: '12px 0', fontSize: '0.9rem', color: 'var(--text)',
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}
          />
          <button onClick={handleSearch} disabled={searching} style={{
            padding: '0 20px', background: 'var(--surface2)',
            border: 'none', borderLeft: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: '0.85rem', cursor: 'pointer',
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults && (
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>
            {searchResults.count} result{searchResults.count !== 1 ? 's' : ''} ({searchResults.type})
            <button onClick={() => { setResults(null); setSearchQ('') }} style={{ marginLeft: 10, color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.78rem' }}>
              clear
            </button>
          </div>
        )}
      </div>

      {/* Selected report */}
      {selected && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={() => setSelected(null)} style={{ fontSize: '0.8rem', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              ✕ Close
            </button>
          </div>
          <ReportViewer report={selected} query="Report" />
        </div>
      )}

      {/* Report list */}
      {loading ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />)}
        </div>
      ) : displayList.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {displayList.map((r, i) => (
            <ReportRow
              key={i}
              report={r}
              isSearch={!!searchResults}
              searchMode={searchMode}
              onOpen={(id) => {
                // Try to fetch by session_id for vector results, fallback to filename
                import('../api/client.js').then(({ getReportBySession, getReportFile }) => {
                  const fn = id.includes('.txt') ? getReportFile(id) : getReportBySession(id)
                  fn.then(d => setSelected(d.content)).catch(() => {})
                })
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color, small }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text3)' }}>
        {icon} <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: small ? '0.7rem' : '1.6rem', fontWeight: 700, color, letterSpacing: small ? 0 : '-0.03em', fontFamily: small ? "'JetBrains Mono', monospace" : 'inherit' }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function ReportRow({ report, onOpen, isSearch, searchMode }) {
  const id = report.session_id || report.filename || ''
  return (
    <div onClick={() => onOpen(id)} style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: 'pointer', transition: 'all 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileText size={16} color="var(--text3)" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>
            {report.query || report.filename}
          </div>
          {isSearch && searchMode === 'semantic' && report.similarity_score && (
            <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontFamily: "'JetBrains Mono', monospace" }}>
              {Math.round(report.similarity_score * 100)}% similar
            </div>
          )}
          {isSearch && report.snippet && (
            <div style={{ fontSize: '0.73rem', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
              ...{report.snippet?.slice(0, 100)}...
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, marginTop: 2 }}>
            {report.date && <Meta icon={<Calendar size={11} />} text={report.date} />}
            {report.word_count && <Meta icon={<Hash size={11} />} text={`${report.word_count} words`} />}
          </div>
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text3)', flexShrink: 0 }}>Open →</div>
    </div>
  )
}

function Meta({ icon, text }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>
      {icon}{text}
    </span>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>No reports yet</div>
      <div style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
        Start a research session to populate your knowledge base.
      </div>
    </div>
  )
}