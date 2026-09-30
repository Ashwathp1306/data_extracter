import httpx
import logging

logger = logging.getLogger(__name__)

async def fetch_leetcode_stats(username: str) -> dict:
    """Fetch LeetCode stats using their public GraphQL API."""
    url = "https://leetcode.com/graphql"
    query = """
    query userProblemsSolved($username: String!) {
        allQuestionsCount {
            difficulty
            count
        }
        matchedUser(username: $username) {
            problemsSolvedBeatsStats {
                difficulty
                percentage
            }
            submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
        }
    }
    """
    
    variables = {"username": username}
    payload = {
        "query": query,
        "variables": variables
    }
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if "errors" in data:
                logger.error(f"LeetCode GraphQL Error for {username}: {data['errors']}")
                return {"success": False, "error": "Profile not found or unavailable"}
                
            matched_user = data.get("data", {}).get("matchedUser")
            if not matched_user:
                return {"success": False, "error": "Profile not found"}
                
            stats = matched_user.get("submitStatsGlobal", {}).get("acSubmissionNum", [])
            
            result = {
                "success": True,
                "easy": 0,
                "medium": 0,
                "hard": 0,
                "total": 0
            }
            
            for stat in stats:
                difficulty = stat.get("difficulty", "").lower()
                count = stat.get("count", 0)
                if difficulty == "easy":
                    result["easy"] = count
                elif difficulty == "medium":
                    result["medium"] = count
                elif difficulty == "hard":
                    result["hard"] = count
                elif difficulty == "all":
                    result["total"] = count
                    
            if result["total"] == 0:
                result["total"] = result["easy"] + result["medium"] + result["hard"]
                
            return result
            
    except httpx.HTTPStatusError as e:
        logger.error(f"LeetCode HTTP error for {username}: {e.response.status_code}")
        return {"success": False, "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"LeetCode request failed for {username}: {str(e)}")
        return {"success": False, "error": "Connection error"}
