import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ResearchPage from './pages/ResearchPage.jsx'
import KnowledgePage from './pages/KnowledgePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirectToLanding />} />
      <Route path="/app" element={<Layout><ResearchPage /></Layout>} />
      <Route path="/app/knowledge" element={<Layout><KnowledgePage /></Layout>} />
      <Route path="/app/history" element={<Layout><HistoryPage /></Layout>} />
    </Routes>
  )
}

function RedirectToLanding() {
  window.location.replace('/landing.html')
  return null
}