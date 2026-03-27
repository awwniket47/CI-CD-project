"""agents/crew_agents.py — Three CrewAI agents using TavilySearch only"""
from crewai import Agent
from core.llm import get_llm_for_crewai
from core.search import TavilySearchTool


def build_agents():
    llm         = get_llm_for_crewai()
    search_tool = TavilySearchTool()

    # ── Agent 1: Researcher
    # Uses Tavily to search and read snippets
    researcher = Agent(
        role="Senior Retail Industry Researcher",
        goal=(
            "Find the most relevant and up-to-date information about the given "
            "retail industry topic by searching the web multiple times with "
            "different queries and collecting all content snippets."
        ),
        backstory=(
            "You are a veteran retail industry researcher with 15 years of experience. "
            "You know how to search smartly — using different angles and keywords "
            "to find the best information from McKinsey, Deloitte, Forbes, Retail Dive, "
            "and NRF. You read every snippet carefully and collect all relevant facts."
        ),
        tools=[search_tool],
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=6,
    )

    # ── Agent 2: Analyst
    analyst = Agent(
        role="Retail Market Intelligence Analyst",
        goal=(
            "Analyse all the research content collected, extract the most important "
            "insights, identify trends, statistics, and real-world company examples, "
            "and organise them into clear structured findings."
        ),
        backstory=(
            "You are a sharp-minded market intelligence analyst specialised in retail. "
            "You cut through noise to find the signal — you identify patterns, "
            "cite specific numbers, and always back insights with evidence from sources."
        ),
        tools=[search_tool],
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=4,
    )

    # ── Agent 3: Writer
    writer = Agent(
        role="Retail Research Report Writer",
        goal=(
            "Write a comprehensive, well-structured, and professional retail "
            "industry research report based on the analyst's findings."
        ),
        backstory=(
            "You are an expert research writer who produces clear, evidence-backed, "
            "and actionable retail industry reports that busy professionals can use immediately."
        ),
        tools=[],
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )

    return researcher, analyst, writer