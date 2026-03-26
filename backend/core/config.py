"""core/config.py — Centralised settings loaded from .env"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # LLM
    gemini_api_key: str      = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str        = "gemini-2.5-flash"

    # Knowledge base (.txt files)
    kb_dir: str              = os.getenv("KB_DIR", "./knowledge_base")

    # ChromaDB vector store
    chroma_dir: str          = os.getenv("CHROMA_DIR", "./chroma_db")
    chroma_collection: str   = "retail_research"

    # Scraper
    scraper_timeout: int     = 20
    max_pages_per_query: int = 5


settings = Settings()