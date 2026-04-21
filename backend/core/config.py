"""core/config.py — Centralised settings with startup validation"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # LLM
    gemini_api_key: str      = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str        = "gemini-2.5-flash"

    # Search
    tavily_api_key: str      = os.getenv("TAVILY_API_KEY", "")

    # Knowledge base (.txt files)
    kb_dir: str              = os.getenv("KB_DIR", "./kb_data")

    # ChromaDB vector store
    chroma_dir: str          = os.getenv("CHROMA_DIR", "./chroma_db")
    chroma_collection: str   = "retail_research"

    # CORS — comma-separated list of allowed origins for production
    # e.g. ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
    allowed_origins: list[str] = [
        o.strip()
        for o in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://localhost:4173",
        ).split(",")
        if o.strip()
    ]

    # Scraper
    scraper_timeout: int     = 20
    max_pages_per_query: int = 5

    def validate(self) -> None:
        """Call once at startup — raises clearly if required keys are missing."""
        missing = []
        if not self.gemini_api_key:
            missing.append(
                "GEMINI_API_KEY — get a free key at https://aistudio.google.com/app/apikey"
            )
        if not self.tavily_api_key:
            missing.append(
                "TAVILY_API_KEY — get a free key at https://tavily.com"
            )
        if missing:
            raise RuntimeError(
                "Missing required environment variables:\n  - "
                + "\n  - ".join(missing)
                + "\n\nAdd them to your .env file and restart."
            )


settings = Settings()
