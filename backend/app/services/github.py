import httpx
import logging
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

# Basic in-memory cache for GitHub stats to avoid redundant API calls within the same process lifecycle
github_cache = {}

async def fetch_github_stats(username: str) -> dict:
    """Fetch GitHub stats using their public API with authentication and caching."""
    # Check cache first
    if username in github_cache:
        return github_cache[username]
        
    url = f"https://api.github.com/users/{username}"
    
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "StudentCodingAnalytics"
    }
    
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 404:
                result = {"success": False, "error": "Profile not found"}
                github_cache[username] = result
                return result
                
            if response.status_code in (403, 429):
                reset_time = response.headers.get("x-ratelimit-reset")
                error_msg = "GitHub API rate limit reached."
                if reset_time:
                    try:
                        reset_dt = datetime.fromtimestamp(int(reset_time))
                        error_msg += f" Please try again after {reset_dt.strftime('%H:%M:%S')}."
                    except ValueError:
                        pass
                # Don't cache rate limit errors so they can be retried later
                return {"success": False, "error": error_msg}
                
            response.raise_for_status()
            data = response.json()
            
            # The API returns public_repos
            repo_count = data.get("public_repos", 0)
            
            result = {
                "success": True,
                "repo_count": repo_count
            }
            github_cache[username] = result
            return result
            
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub HTTP error for {username}: {e.response.status_code}")
        if e.response.status_code == 401:
            return {"success": False, "error": "GitHub authentication failed. Check GITHUB_TOKEN."}
        return {"success": False, "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"GitHub request failed for {username}: {str(e)}")
        return {"success": False, "error": "Connection error"}

async def check_github_rate_limit() -> dict:
    """Check GitHub API rate limit status."""
    url = "https://api.github.com/rate_limit"
    
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "StudentCodingAnalytics"
    }
    
    is_authenticated = bool(settings.github_token)
    if is_authenticated:
        headers["Authorization"] = f"Bearer {settings.github_token}"
        
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 401:
                return {
                    "authenticated": False,
                    "github_api": "authentication_failed",
                    "error": "Invalid GITHUB_TOKEN"
                }
                
            response.raise_for_status()
            data = response.json()
            core = data.get("resources", {}).get("core", {})
            
            return {
                "authenticated": is_authenticated,
                "github_api": "connected",
                "limit": core.get("limit", 0),
                "remaining": core.get("remaining", 0),
                "used": core.get("used", 0),
                "reset": core.get("reset", 0)
            }
    except Exception as e:
        logger.error(f"Failed to check GitHub rate limit: {str(e)}")
        return {
            "authenticated": is_authenticated,
            "github_api": "not_configured" if not is_authenticated else "connection_error",
            "error": "Failed to connect to GitHub API"
        }
