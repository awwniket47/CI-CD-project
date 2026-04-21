"""tests/test_research.py — Research API endpoint tests"""
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    with patch("core.config.Settings.validate"):
        with patch("knowledge_base.repository.KnowledgeRepository.stats") as mock_stats:
            mock_stats.return_value = {
                "total_reports_vector": 0,
                "total_reports_txt": 0,
            }
            from main import app
            # raise_server_exceptions=False prevents background task errors
            # (RuntimeError: cannot schedule new futures after shutdown)
            # from crashing the TestClient after the 202 response is returned.
            with TestClient(app, raise_server_exceptions=False) as c:
                yield c


def test_start_research_valid_query(client):
    # Patch where the name is USED (in the router), not where it is defined.
    # The router does `from agents.orchestrator import run_research_async`
    # which binds its own reference — patching the source has no effect.
    with patch("api.routes.run_research_async", new=AsyncMock(return_value=None)):
        response = client.post("/api/research", json={"query": "AI in retail industry trends"})
    assert response.status_code == 202


def test_start_research_returns_session_id(client):
    with patch("api.routes.run_research_async", new=AsyncMock(return_value=None)):
        response = client.post("/api/research", json={"query": "AI in retail industry trends"})
    assert "session_id" in response.json()


def test_start_research_query_too_short(client):
    response = client.post("/api/research", json={"query": "AI"})
    assert response.status_code == 422


def test_start_research_empty_query(client):
    response = client.post("/api/research", json={"query": ""})
    assert response.status_code == 422


def test_get_session_not_found(client):
    response = client.get("/api/research/nonexistent-session-id")
    assert response.status_code == 404


def test_list_sessions(client):
    response = client.get("/api/sessions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_agents(client):
    response = client.get("/api/agents")
    assert response.status_code == 200
    data = response.json()
    assert "agents" in data
    assert len(data["agents"]) == 4