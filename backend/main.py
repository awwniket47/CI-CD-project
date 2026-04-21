"""main.py — FastAPI entry point for Retail Researcher Agent backend"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────
    # Validate required API keys early — fail loudly before any request
    settings.validate()

    os.makedirs(settings.kb_dir, exist_ok=True)

    yield

    # ── Shutdown ─────────────────────────────────────────────────────
    # Cleanly drain the thread pool used by the research pipeline
    from agents.orchestrator import _executor
    _executor.shutdown(wait=False)


app = FastAPI(
    title="Retail Researcher Agent",
    description="Autonomous AI research agent using Gemini + Tavily + ChromaDB",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,   # reads from ALLOWED_ORIGINS env var
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "running", "docs": "/docs", "api": "/api/health"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
