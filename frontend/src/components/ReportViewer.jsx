// src/components/ReportViewer.jsx — Renders the markdown research report
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'
import { Copy, CheckCheck, Download, FileText } from 'lucide-react'

export default function ReportViewer({ report, query, filePath, elapsed }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([report], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `retail-research-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fade-up" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
    }}>
      {/* Header bar */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={16} color="var(--green)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Research Report</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
              {elapsed && `Generated in ${elapsed}s`}
              {filePath && ` · Saved to KB`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} style={btnStyle}>
            {copied ? <CheckCheck size={14} color="var(--green)" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleDownload} style={btnStyle}>
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {/* File path pill */}
      {filePath && (
        <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <span style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text3)' }}>
            💾 {filePath}
          </span>
        </div>
      )}

      {/* Report body */}
      <div className="report-body" style={{ padding: '28px 32px', maxHeight: '70vh', overflowY: 'auto' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report}
        </ReactMarkdown>
      </div>
    </div>
  )
}

const btnStyle = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)',
  background: 'var(--surface2)', color: 'var(--text2)',
  fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: "'Bricolage Grotesque', sans-serif",
}