import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ResearchPage from './pages/ResearchPage.jsx'
import KnowledgePage from './pages/KnowledgePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<ResearchPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/history"   element={<HistoryPage />} />
      </Routes>
    </Layout>
  )
}