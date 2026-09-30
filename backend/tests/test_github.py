import pytest
import httpx
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.github import fetch_github_stats, check_github_rate_limit, github_cache
from app.config import settings

@pytest.fixture(autouse=True)
def clear_cache():
    github_cache.clear()
    # default test token
    settings.github_token = "fake_test_token"
    yield
    github_cache.clear()

@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_fetch_github_stats_success(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"public_repos": 15}
    mock_get.return_value = mock_response

    res = await fetch_github_stats("octocat")
    assert res["success"] is True
    assert res["repo_count"] == 15
    assert "octocat" in github_cache

    # Test cache hit
    mock_get.reset_mock()
    res2 = await fetch_github_stats("octocat")
    assert res2["success"] is True
    assert res2["repo_count"] == 15
    mock_get.assert_not_called()  # Did not hit API again

@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_fetch_github_stats_not_found(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_get.return_value = mock_response

    res = await fetch_github_stats("invaliduser1234")
    assert res["success"] is False
    assert res["error"] == "Profile not found"

@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_fetch_github_stats_rate_limit(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 403
    mock_response.headers = {"x-ratelimit-reset": "1700000000"}
    mock_get.return_value = mock_response

    res = await fetch_github_stats("octocat")
    assert res["success"] is False
    assert "rate limit reached" in res["error"]
    assert "octocat" not in github_cache  # Should not cache rate limit errors

@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_fetch_github_stats_timeout(mock_get):
    mock_get.side_effect = httpx.TimeoutException("Timeout")

    res = await fetch_github_stats("octocat")
    assert res["success"] is False
    assert res["error"] == "Connection error"

@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_check_github_rate_limit_authenticated(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "resources": {
            "core": {
                "limit": 5000,
                "remaining": 4999,
                "used": 1,
                "reset": 1372700873
            }
        }
    }
    mock_get.return_value = mock_response

    res = await check_github_rate_limit()
    assert res["authenticated"] is True
    assert res["github_api"] == "connected"
    assert res["limit"] == 5000
    assert res["remaining"] == 4999

@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_check_github_rate_limit_invalid_token(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_get.return_value = mock_response

    res = await check_github_rate_limit()
    assert res["authenticated"] is False
    assert res["github_api"] == "authentication_failed"

@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_check_github_rate_limit_no_token(mock_get):
    settings.github_token = ""
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "resources": {
            "core": {
                "limit": 60,
                "remaining": 59
            }
        }
    }
    mock_get.return_value = mock_response

    res = await check_github_rate_limit()
    assert res["authenticated"] is False
    assert res["github_api"] == "connected"
    assert res["limit"] == 60
