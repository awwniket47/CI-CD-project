"""agents/orchestrator.py — Runs CrewAI pipeline, streams progress via SSE"""
import asyncio
import json
import time
from collections import OrderedDict
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from typing import AsyncGenerator

from loguru import logger

from agents.crew_tasks import build_crew
from knowledge_base.repository import KnowledgeRepository

repo = KnowledgeRepository()

# ── Session store with automatic eviction ────────────────────────────────────
# OrderedDict preserves insertion order so we can evict the oldest entries.
# Keeps memory bounded to MAX_SESSIONS * ~10 KB ≈ 1 MB max.
MAX_SESSIONS = 100
_sessions: OrderedDict[str, dict] = OrderedDict()


def _evict_old_sessions() -> None:
    """Drop the oldest sessions when the store exceeds MAX_SESSIONS."""
    while len(_sessions) >= MAX_SESSIONS:
        _sessions.popitem(last=False)


AGENT_STEPS = [
    {"id": "researcher",  "name": "Research Agent",  "icon": "🔍", "desc": "Searching TavilySearch for retail information"},
    {"id": "analyst",     "name": "Analyst Agent",   "icon": "🧠", "desc": "Extracting insights from search results"},
    {"id": "writer",      "name": "Writer Agent",    "icon": "✍️",  "desc": "Writing the final research report"},
    {"id": "saving",      "name": "Knowledge Base",  "icon": "💾", "desc": "Saving report to ChromaDB + .txt file"},
]


def create_session(query: str) -> str:
    import uuid
    _evict_old_sessions()
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "id": session_id, "query": query,
        "status": "pending", "current_step": -1,
        "log_lines": [], "report": None,
        "file_path": None, "error": None,
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None, "elapsed_seconds": None,
    }
    return session_id


def get_session(session_id: str) -> dict | None:
    return _sessions.get(session_id)


def _run_crew_sync(session_id: str, query: str):
    session = _sessions[session_id]
    start   = time.time()

    def _log(msg: str):
        session["log_lines"].append(f"[{datetime.utcnow().strftime('%H:%M:%S')}] {msg}")
        logger.info(f"[{session_id[:8]}] {msg}")

    try:
        session["status"] = "running"
        _log(f"Starting research: '{query}'")

        session["current_step"] = 0
        _log("Research Agent activated — searching TavilySearch...")

        crew   = build_crew(query, session=session)
        result = crew.kickoff(inputs={"query": query})

        report_text = str(result)
        elapsed     = round(time.time() - start, 2)

        session["current_step"] = 3
        _log("Saving to ChromaDB vector store + .txt file...")

        file_path = repo.save(
            query=query,
            report=report_text,
            session_id=session_id,
            metadata={
                "sources_count": report_text.lower().count("http"),
                "word_count": len(report_text.split()),
            },
        )
        _log(f"Saved — {len(report_text.split())} words in {elapsed}s")

        session["status"]          = "completed"
        session["report"]          = report_text
        session["file_path"]       = file_path
        session["elapsed_seconds"] = elapsed
        session["completed_at"]    = datetime.utcnow().isoformat()

    except Exception as e:
        session["status"]          = "failed"
        session["error"]           = str(e)
        session["elapsed_seconds"] = round(time.time() - start, 2)
        session["completed_at"]    = datetime.utcnow().isoformat()
        _log(f"Failed: {e}")
        logger.exception(f"Pipeline failed for {session_id}")


# Exported so main.py lifespan can call _executor.shutdown() on app stop
_executor = ThreadPoolExecutor(max_workers=3)


async def run_research_async(session_id: str, query: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(_executor, _run_crew_sync, session_id, query)


async def stream_progress(session_id: str) -> AsyncGenerator[str, None]:
    last_log_count = 0
    last_step      = -2

    while True:
        session = _sessions.get(session_id)
        if not session:
            yield f"data: {json.dumps({'event': 'error', 'message': 'Session not found'})}\n\n"
            return

        current_step = session["current_step"]
        new_logs     = session["log_lines"][last_log_count:]
        last_log_count = len(session["log_lines"])

        if current_step != last_step:
            last_step  = current_step
            step_data  = AGENT_STEPS[current_step] if 0 <= current_step < len(AGENT_STEPS) else {}
            yield f"data: {json.dumps({'event': 'step', 'step': current_step, 'agent': step_data, 'status': session['status']})}\n\n"

        for line in new_logs:
            yield f"data: {json.dumps({'event': 'log', 'message': line})}\n\n"

        if session["status"] == "completed":
            yield f"data: {json.dumps({'event': 'completed', 'session_id': session_id, 'elapsed': session['elapsed_seconds']})}\n\n"
            return

        if session["status"] == "failed":
            yield f"data: {json.dumps({'event': 'failed', 'error': session.get('error', 'Unknown error')})}\n\n"
            return

        await asyncio.sleep(0.8)