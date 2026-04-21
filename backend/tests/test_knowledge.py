"""tests/test_knowledge.py — Knowledge base endpoint tests"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


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


def test_list_knowledge(client):
    with patch("knowledge_base.repository.KnowledgeRepository.list_reports") as mock_list:
        mock_list.return_value = []
        response = client.get("/api/knowledge")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


def test_knowledge_stats(client):
    with patch("knowledge_base.repository.KnowledgeRepository.stats") as mock_stats:
        mock_stats.return_value = {
            "total_reports_vector": 5,
            "total_reports_txt": 5,
            "kb_dir": "./kb_data",
            "chroma_dir": "./chroma_db",
        }
        response = client.get("/api/knowledge/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_reports_vector" in data
        assert "total_reports_txt" in data


def test_semantic_search(client):
    with patch("knowledge_base.repository.KnowledgeRepository.semantic_search") as mock_search:
        mock_search.return_value = []
        response = client.get("/api/knowledge/search/semantic?q=retail+trends")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "query" in data


def test_keyword_search(client):
    with patch("knowledge_base.repository.KnowledgeRepository.keyword_search") as mock_search:
        mock_search.return_value = []
        response = client.get("/api/knowledge/search/keyword?q=retail")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data


def test_get_report_not_found(client):
    with patch("knowledge_base.repository.KnowledgeRepository.get_report_by_session") as mock_get:
        mock_get.return_value = None
        response = client.get("/api/knowledge/report/nonexistent-id")
        assert response.status_code == 404