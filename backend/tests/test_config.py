"""tests/test_config.py — Settings and config tests"""
import pytest
import os
from unittest.mock import patch


def test_settings_has_default_kb_dir():
    from core.config import settings
    assert settings.kb_dir is not None
    assert len(settings.kb_dir) > 0


def test_settings_has_default_chroma_dir():
    from core.config import settings
    assert settings.chroma_dir is not None


def test_settings_has_model_name():
    from core.config import settings
    assert settings.gemini_model == "gemini-2.5-flash"


def test_settings_validate_raises_without_keys():
    from core.config import Settings
    s = Settings()
    s.gemini_api_key = ""
    s.tavily_api_key = ""
    with pytest.raises(RuntimeError) as exc_info:
        s.validate()
    assert "GEMINI_API_KEY" in str(exc_info.value)
    assert "TAVILY_API_KEY" in str(exc_info.value)


def test_settings_validate_passes_with_keys():
    from core.config import Settings
    s = Settings()
    s.gemini_api_key = "fake-key"
    s.tavily_api_key = "fake-key"
    s.validate()


def test_allowed_origins_is_list():
    from core.config import settings
    assert isinstance(settings.allowed_origins, list)
    assert len(settings.allowed_origins) > 0