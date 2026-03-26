"""core/llm.py — Gemini LLM factory for LangChain + CrewAI"""
from core.config import settings


def get_llm_for_crewai(temperature: float = 0.2):
    """
    Returns a LangChain-compatible Gemini LLM for CrewAI agents.
    CrewAI accepts any LangChain LLM directly.
    """
    if not settings.gemini_api_key:
        raise ValueError(
            "GEMINI_API_KEY not set. "
            "Get a free key at https://aistudio.google.com/app/apikey "
            "and add it to your .env file."
        )

    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        temperature=temperature,
        convert_system_message_to_human=True,  # Required for Gemini
        max_output_tokens=8192,
    )
