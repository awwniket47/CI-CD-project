"""tests/test_health.py — API health endpoint tests"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def client():
    with patch("core.config.Settings.validate"):
        with patch("knowledge_base.repository.KnowledgeRepository.stats") as mock_stats:
            mock_stats.return_value = {
                "total_reports_vector": 0,
                "total_reports_txt": 0,
            }
            from main import app
            with TestClient(app) as c:
                yield c


def test_health_returns_200(client):
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_returns_ok_status(client):
    response = client.get("/api/health")
    data = response.json()
    assert data["status"] == "ok"


def test_health_has_required_fields(client):
    response = client.get("/api/health")
    data = response.json()
    assert "gemini_configured" in data
    assert "vector_db" in data
    assert "timestamp" in data


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"