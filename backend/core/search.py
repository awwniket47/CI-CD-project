"""
core/search.py — Tavily search tool (reliable, built for AI agents)
Free tier: 1000 searches/month. No rate limiting issues.
"""
import asyncio
import os
from typing import Type
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from loguru import logger
from dotenv import load_dotenv

load_dotenv()


class SearchInput(BaseModel):
    query: str = Field(description="Search query to look up")


class TavilySearchTool(BaseTool):
    """
    Searches the web using Tavily API — built specifically for AI agents.
    Returns clean, relevant results with no rate limiting.
    Free tier: 1000 searches/month.
    """
    name: str = "web_search"
    description: str = (
        "Search the web for retail industry information, news, and reports. "
        "Returns relevant titles, URLs, and content from authoritative sources. "
        "Input: a specific search query string."
    )
    args_schema: Type[BaseModel] = SearchInput

    def _run(self, query: str) -> str:
        return self._search(query)

    async def _arun(self, query: str) -> str:
        # Run the blocking HTTP call in a thread so the event loop stays free
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._search, query)

    def _search(self, query: str) -> str:
        api_key = os.getenv("TAVILY_API_KEY", "")

        if not api_key:
            return "TAVILY_API_KEY not set in .env. Get a free key at https://tavily.com"

        try:
            from tavily import TavilyClient

            client  = TavilyClient(api_key=api_key)
            results = client.search(
                query=query,
                search_depth="basic",
                max_results=5,
                include_answer=True,
            )

            output = []

            if results.get("answer"):
                output.append(f"[DIRECT ANSWER]\n{results['answer']}\n")

            for i, r in enumerate(results.get("results", []), 1):
                content = (r.get("content") or "")[:300]
                output.append(
                    f"[RESULT {i}]\n"
                    f"Title  : {r.get('title', '')}\n"
                    f"URL    : {r.get('url', '')}\n"
                    f"Content: {content}\n"
                )

            final = "\n".join(output) if output else "No results found."
            logger.info(f"Tavily search '{query}' -> {len(results.get('results', []))} results")
            return final

        except Exception as e:
            logger.error(f"Tavily search failed: {e}")
            return f"Search failed: {e}"
