"""api/routes.py — All FastAPI endpoints (ChromaDB version)"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agents.orchestrator import (
    create_session, get_session, run_research_async,
    stream_progress, AGENT_STEPS, _sessions,
    repo,  # reuse the single shared instance — avoids duplicate ChromaDB PersistentClient
)

router = APIRouter()


# ── Schemas
class ResearchRequest(BaseModel):
    query: str = Field(min_length=5, max_length=300)


class ResearchStartResponse(BaseModel):
    session_id: str
    query: str
    message: str
    stream_url: str


# ── Start research
@router.post("/research", response_model=ResearchStartResponse, status_code=202)
async def start_research(body: ResearchRequest, bg: BackgroundTasks):
    session_id = create_session(body.query)
    bg.add_task(run_research_async, session_id, body.query)
    return ResearchStartResponse(
        session_id=session_id,
        query=body.query,
        message="Research started. Connect to stream_url for live progress.",
        stream_url=f"/api/research/{session_id}/stream",
    )


# ── SSE stream
@router.get("/research/{session_id}/stream")
async def stream_research(session_id: str):
    if not get_session(session_id):
        raise HTTPException(404, "Session not found")
    return StreamingResponse(
        stream_progress(session_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Get session result
@router.get("/research/{session_id}")
async def get_research_result(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return {
        "session_id": session["id"],
        "query": session["query"],
        "status": session["status"],
        "current_step": session["current_step"],
        "log_lines": session["log_lines"],
        "report": session["report"],
        "file_path": session["file_path"],
        "error": session["error"],
        "started_at": session["started_at"],
        "completed_at": session["completed_at"],
        "elapsed_seconds": session["elapsed_seconds"],
    }


# ── List sessions
@router.get("/sessions")
async def list_sessions():
    return [
        {
            "session_id": s["id"],
            "query": s["query"],
            "status": s["status"],
            "elapsed_seconds": s["elapsed_seconds"],
            "started_at": s["started_at"],
        }
        for s in _sessions.values()
    ]


# ── Knowledge Base — list all reports
@router.get("/knowledge")
async def list_knowledge(limit: int = Query(50, le=200)):
    return repo.list_reports(limit=limit)


# ── Knowledge Base — stats
@router.get("/knowledge/stats")
async def knowledge_stats():
    return repo.stats()


# ── Semantic search (ChromaDB)
@router.get("/knowledge/search/semantic")
async def semantic_search(
    q: str = Query(min_length=2),
    n: int = Query(5, le=20),
):
    results = repo.semantic_search(q, n_results=n)
    return {"query": q, "type": "semantic", "count": len(results), "results": results}


# ── Keyword search (.txt files)
@router.get("/knowledge/search/keyword")
async def keyword_search(q: str = Query(min_length=2)):
    results = repo.keyword_search(q)
    return {"query": q, "type": "keyword", "count": len(results), "results": results}


# ── Get report by session ID (from ChromaDB)
@router.get("/knowledge/report/{session_id}")
async def get_report(session_id: str):
    content = repo.get_report_by_session(session_id)
    if not content:
        raise HTTPException(404, "Report not found")
    return {"session_id": session_id, "content": content}


# ── Get report by filename (.txt)
@router.get("/knowledge/file/{filename}")
async def get_report_file(filename: str):
    content = repo.get_report_file(filename)
    if not content:
        raise HTTPException(404, f"File '{filename}' not found")
    return {"filename": filename, "content": content}


# ── Agents info
@router.get("/agents")
async def list_agents():
    return {"agents": AGENT_STEPS}


# ── Health check
@router.get("/health")
async def health():
    from datetime import datetime
    from core.config import settings
    stats = repo.stats()
    return {
        "status": "ok",
        "gemini_configured": bool(settings.gemini_api_key),
        "search_tool": "TavilySearch (no key required)",
        "scraper": "Scrapy",
        "vector_db": "ChromaDB",
        "kb_reports_vector": stats["total_reports_vector"],
        "kb_reports_txt": stats["total_reports_txt"],
        "timestamp": datetime.utcnow().isoformat(),
    }
