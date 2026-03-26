"""main.py — FastAPI entry point for Retail Researcher Agent backend"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.kb_dir, exist_ok=True)
    yield


app = FastAPI(
    title="Retail Researcher Agent",
    description="Autonomous AI research agent using Gemini + Serper + Scrapy/Scrapling",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
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
