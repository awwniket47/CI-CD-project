"""agents/crew_tasks.py — Task definitions and Crew assembly (Tavily only)"""
from datetime import datetime
from crewai import Task, Crew, Process
from agents.crew_agents import build_agents


def build_crew(query: str, session: dict = None) -> Crew:
    researcher, analyst, writer = build_agents()

    def _log(msg: str):
        if session:
            session["log_lines"].append(f"[{datetime.utcnow().strftime('%H:%M:%S')}] {msg}")

    def on_researcher_done(output):
        if session:
            session["current_step"] = 1
            _log("Researcher done — passing to Analyst")

    def on_analyst_done(output):
        if session:
            session["current_step"] = 2
            _log("Analyst done — passing to Writer")

    def on_writer_done(output):
        if session:
            session["current_step"] = 3
            _log("Writer done — saving to ChromaDB")

    # ── TASK 1: Research — search multiple times, collect snippets
    research_task = Task(
        description=(
            f"Research the following retail industry topic thoroughly:\n\n"
            f'TOPIC: "{query}"\n\n'
            f"Your steps:\n"
            f"1. Search at least 3 different queries related to the topic\n"
            f"   Example variations: '{query}', 'latest {query} trends', "
            f"   '{query} statistics 2024', '{query} real world examples'\n"
            f"2. Read ALL content snippets carefully from each search\n"
            f"3. Collect all facts, statistics, company names, and insights\n"
            f"4. Do NOT summarise yet — just gather everything you find\n\n"
            f"Focus on: authoritative sources, recent data (2023-2025), "
            f"specific statistics, real company examples like Amazon, Walmart, Zara."
        ),
        agent=researcher,
        expected_output=(
            "A comprehensive collection of raw research data: all snippets read, "
            "key statistics found, company examples, technology names, and source URLs. "
            "Detailed raw material — NOT a summary."
        ),
        callback=on_researcher_done,
    )

    # ── TASK 2: Analyse — extract structured insights
    analysis_task = Task(
        description=(
            f"Analyse all the raw research content about: '{query}'\n\n"
            f"Your job:\n"
            f"1. Read all content from the researcher carefully\n"
            f"2. Identify the 5-7 most important insights or trends\n"
            f"3. Extract specific statistics and percentages\n"
            f"4. Find real-world company examples\n"
            f"5. Structure your findings under clear headings\n"
            f"6. List all sources with URLs\n\n"
            f"Be specific — '25% cost reduction' is better than 'cost reduction'."
        ),
        agent=analyst,
        expected_output=(
            "Structured analysis: 5-7 key insights with evidence, "
            "specific statistics, real company examples, and source list."
        ),
        context=[research_task],
        callback=on_analyst_done,
    )

    # ── TASK 3: Write — produce the final report
    write_task = Task(
        description=(
            f"Write a professional retail industry research report on: '{query}'\n\n"
            f"Use EXACTLY this structure:\n\n"
            f"# [Report Title]\n\n"
            f"## Executive Summary\n"
            f"(3-4 sentences — the key takeaway)\n\n"
            f"## Key Findings\n"
            f"(5-7 numbered findings with evidence and statistics)\n\n"
            f"## Industry Trends\n"
            f"(Major trends with real examples)\n\n"
            f"## Real-World Examples\n"
            f"(Specific companies — Amazon, Walmart, Zara, etc.)\n\n"
            f"## Challenges & Opportunities\n"
            f"(Barriers and emerging opportunities)\n\n"
            f"## Future Outlook\n"
            f"(Where is this heading in 2-5 years?)\n\n"
            f"## Sources\n"
            f"(All URLs used)\n\n"
            f"Minimum 600 words. Professional tone. No fluff."
        ),
        agent=writer,
        expected_output=(
            "A complete research report following the exact structure above. "
            "Professional tone, evidence-backed, minimum 600 words."
        ),
        context=[research_task, analysis_task],
        callback=on_writer_done,
    )

    return Crew(
        agents=[researcher, analyst, writer],
        tasks=[research_task, analysis_task, write_task],
        process=Process.sequential,
        verbose=True,
        memory=False,
    )