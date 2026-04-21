import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

// Normalise all API errors into a single shape so every page gets the same
// human-readable message from FastAPI's `detail` field automatically.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export const startResearch = (query) =>
  api.post('/research', { query }).then(r => r.data)

export const getSession = (sessionId) =>
  api.get(`/research/${sessionId}`).then(r => r.data)

export const getSessions = () =>
  api.get('/sessions').then(r => r.data)

// Knowledge Base
export const getKnowledge = () =>
  api.get('/knowledge').then(r => r.data)

export const getKnowledgeStats = () =>
  api.get('/knowledge/stats').then(r => r.data)

// Semantic search (ChromaDB vector similarity)
export const semanticSearch = (q, n = 5) =>
  api.get('/knowledge/search/semantic', { params: { q, n } }).then(r => r.data)

// Keyword search (.txt files)
export const keywordSearch = (q) =>
  api.get('/knowledge/search/keyword', { params: { q } }).then(r => r.data)

export const getReportBySession = (sessionId) =>
  api.get(`/knowledge/report/${sessionId}`).then(r => r.data)

export const getReportFile = (filename) =>
  api.get(`/knowledge/file/${filename}`).then(r => r.data)

export const getHealth = () =>
  api.get('/health').then(r => r.data)

// SSE helper
export const createEventSource = (sessionId) =>
  new EventSource(`/api/research/${sessionId}/stream`)