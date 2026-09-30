import asyncio
import uuid
from typing import Dict
from app.models.schemas import StudentValidation, StudentResult, JobStatus, JobResultResponse
from app.services.leetcode import fetch_leetcode_stats
from app.services.github import fetch_github_stats
from app.utils.excel import generate_report_excel
import logging

logger = logging.getLogger(__name__)

# Simple in-memory store for jobs
jobs_store: Dict[str, dict] = {}

def get_job_status(job_id: str) -> JobStatus:
    if job_id not in jobs_store:
        return None
        
    job = jobs_store[job_id]
    
    total = len(job["results"])
    processed = 0
    successful = 0
    partial = 0
    failed = 0
    
    for r in job["results"]:
        if r.status != "Pending":
            processed += 1
            if r.status == "Success":
                successful += 1
            elif r.status == "Partial":
                partial += 1
            else:
                failed += 1
                
    return JobStatus(
        job_id=job_id,
        status=job["status"],
        total=total,
        processed=processed,
        successful=successful,
        partial=partial,
        failed=failed
    )

def get_job_results(job_id: str) -> JobResultResponse:
    if job_id not in jobs_store:
        return None
        
    status = get_job_status(job_id)
    summary = {
        "total": status.total,
        "successful": status.successful,
        "partial": status.partial,
        "failed": status.failed
    }
    
    return JobResultResponse(
        job_id=job_id,
        status=jobs_store[job_id]["status"],
        results=jobs_store[job_id]["results"],
        summary=summary
    )

def get_excel_report(job_id: str) -> bytes:
    if job_id not in jobs_store:
        return None
        
    job = jobs_store[job_id]
    status = get_job_status(job_id)
    summary = {
        "total": status.total,
        "successful": status.successful,
        "partial": status.partial,
        "failed": status.failed
    }
    
    return generate_report_excel(job["results"], summary)

async def process_student(result: StudentResult, lc_username: str, gh_username: str):
    """Fetch data for a single student."""
    lc_success = False
    gh_success = False
    error_msgs = []
    
    # Run requests concurrently
    tasks = []
    if lc_username:
        tasks.append(fetch_leetcode_stats(lc_username))
    else:
        # Invalid LeetCode profile
        tasks.append(asyncio.sleep(0, result={"success": False, "error": "Invalid LeetCode Profile"}))
        
    if gh_username:
        tasks.append(fetch_github_stats(gh_username))
    else:
        tasks.append(asyncio.sleep(0, result={"success": False, "error": "Invalid GitHub Profile"}))
        
    # We await both
    res = await asyncio.gather(*tasks, return_exceptions=True)
    
    lc_res = res[0]
    gh_res = res[1]
    
    if isinstance(lc_res, dict) and lc_res.get("success"):
        result.easy = lc_res["easy"]
        result.medium = lc_res["medium"]
        result.hard = lc_res["hard"]
        result.total_solved = lc_res["total"]
        lc_success = True
    else:
        err = lc_res.get("error", "Failed") if isinstance(lc_res, dict) else str(lc_res)
        error_msgs.append(f"LeetCode: {err}")
        
    if isinstance(gh_res, dict) and gh_res.get("success"):
        result.repo_count = gh_res["repo_count"]
        gh_success = True
    else:
        err = gh_res.get("error", "Failed") if isinstance(gh_res, dict) else str(gh_res)
        error_msgs.append(f"GitHub: {err}")
        
    if lc_success and gh_success:
        result.status = "Success"
    elif lc_success or gh_success:
        result.status = "Partial"
        result.error_message = "; ".join(error_msgs)
    else:
        result.status = "Failed"
        result.error_message = "; ".join(error_msgs)

async def process_job(job_id: str, valid_students: list[StudentValidation]):
    """Background task to process a list of students."""
    try:
        job = jobs_store[job_id]
        results = job["results"]
        
        # Extract all unique GitHub usernames first, normalize, and remove duplicates
        unique_gh_usernames = set()
        for student in valid_students:
            if student.is_valid and student.github_username:
                normalized = student.github_username.strip().lower()
                student.github_username = normalized
                unique_gh_usernames.add(normalized)
                
        # Pre-fetch GitHub profiles (cache is checked inside fetch_github_stats)
        for gh_user in unique_gh_usernames:
            res = await fetch_github_stats(gh_user)
            if res.get("error", "").startswith("GitHub API rate limit reached"):
                logger.warning(f"Rate limit hit while pre-fetching GitHub profiles for job {job_id}")
                break
        
        for idx, student in enumerate(valid_students):
            result_obj = next((r for r in results if r.reg_no == student.reg_no), None)
            if not result_obj:
                continue
                
            if not student.is_valid:
                result_obj.status = "Failed"
                result_obj.error_message = student.validation_message
                continue
                
            await process_student(result_obj, student.leetcode_username, student.github_username)
            await asyncio.sleep(0.5)
            
        job["status"] = "Completed"
        
        # Save to DB if user_id is present
        user_id = job.get("user_id")
        if user_id:
            from app.db import SessionLocal
            from app.models.db_models import Report, StudentSnapshot
            import json
            from datetime import datetime
            
            db = SessionLocal()
            try:
                results_data = [r.dict() for r in results]
                # Ensure no duplicate report
                existing = db.query(Report).filter(Report.id == job_id).first()
                if not existing:
                    report = Report(id=job_id, user_id=user_id, results_json=json.dumps(results_data))
                    db.add(report)
                    
                    # Save historical snapshots for successful leetcode extractions
                    now = datetime.utcnow()
                    for r in results:
                        if r.status in ["Success", "Partial"] and r.easy is not None:
                            snapshot = StudentSnapshot(
                                user_id=user_id,
                                name=r.name,
                                reg_no=r.reg_no,
                                easy=r.easy,
                                medium=r.medium,
                                hard=r.hard,
                                total_solved=r.total_solved,
                                created_at=now
                            )
                            db.add(snapshot)
                            
                    db.commit()
            except Exception as db_e:
                logger.error(f"Failed to save report to DB: {db_e}")
            finally:
                db.close()
                
    except Exception as e:
        logger.error(f"Job {job_id} failed: {str(e)}")
        jobs_store[job_id]["status"] = "Failed"

def create_job(students: list[StudentValidation], user_id: int = None) -> str:
    job_id = str(uuid.uuid4())
    
    results = []
    for s in students:
        results.append(StudentResult(
            reg_no=s.reg_no,
            name=s.name,
            leetcode_url=s.leetcode_url,
            github_url=s.github_url,
            status="Pending" if s.is_valid else "Failed",
            error_message=s.validation_message if not s.is_valid else None
        ))
        
    jobs_store[job_id] = {
        "status": "Processing",
        "results": results,
        "valid_students": students,
        "user_id": user_id
    }
    return job_id
