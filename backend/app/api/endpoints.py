from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.utils.excel import validate_excel, generate_report_excel
from app.services.processor import create_job, process_job, get_job_status, get_job_results, jobs_store
from app.models.schemas import ValidationResponse, JobStatus, JobResultResponse, StudentResult
from app.models.db_models import User, Report, StudentSnapshot

from app.db import get_db
from app.services.github import check_github_rate_limit
import os
import json
from datetime import datetime
from sqlalchemy import desc

router = APIRouter()

@router.get("/github/status")
async def github_status():
    return await check_github_rate_limit()

@router.get("/github/rate-limit")
async def github_rate_limit():
    return await check_github_rate_limit()

@router.post("/upload", response_model=ValidationResponse)
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files are supported")
        
    content = await file.read()
    students, is_valid, msg = validate_excel(content)
    
    if not is_valid and not students:
        raise HTTPException(status_code=400, detail=msg)
        
    valid_count = sum(1 for s in students if s.is_valid)
    invalid_count = len(students) - valid_count
    
    job_id = create_job(students)
    
    return ValidationResponse(
        job_id=job_id,
        total_students=len(students),
        valid_students=valid_count,
        invalid_students=invalid_count,
        preview=students
    )

@router.post("/analyze/{job_id}")
async def analyze_job(job_id: str, background_tasks: BackgroundTasks):
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = jobs_store[job_id]
    background_tasks.add_task(process_job, job_id, job["valid_students"])
    return {"message": "Analysis started"}

@router.get("/status/{job_id}", response_model=JobStatus)
async def get_status(job_id: str, db: Session = Depends(get_db)):
    if job_id in jobs_store:
        return get_job_status(job_id)
        
    # Check DB
    report = db.query(Report).filter(Report.id == job_id).first()
    if report:
        results = [StudentResult(**r) for r in json.loads(report.results_json)]
        return JobStatus(
            job_id=job_id, status="Completed", total=len(results),
            processed=len(results), successful=sum(1 for r in results if r.status == "Success"),
            partial=sum(1 for r in results if r.status == "Partial"),
            failed=sum(1 for r in results if r.status == "Failed")
        )
        
    raise HTTPException(status_code=404, detail="Job not found")

@router.get("/results/{job_id}", response_model=JobResultResponse)
async def get_results(job_id: str, db: Session = Depends(get_db)):
    if job_id in jobs_store:
        return get_job_results(job_id)
        
    # Check DB
    report = db.query(Report).filter(Report.id == job_id).first()
    if report:
        results = [StudentResult(**r) for r in json.loads(report.results_json)]
        summary = {
            "total": len(results),
            "successful": sum(1 for r in results if r.status == "Success"),
            "partial": sum(1 for r in results if r.status == "Partial"),
            "failed": sum(1 for r in results if r.status == "Failed")
        }
        return JobResultResponse(job_id=job_id, status="Completed", results=results, summary=summary)
        
    raise HTTPException(status_code=404, detail="Job not found")

@router.get("/download/{job_id}")
async def download_report(job_id: str, db: Session = Depends(get_db)):
    if job_id in jobs_store:
        from app.services.processor import get_excel_report
        excel_bytes = get_excel_report(job_id)
    else:
        report = db.query(Report).filter(Report.id == job_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Job not found")
        results = [StudentResult(**r) for r in json.loads(report.results_json)]
        summary = {
            "total": len(results), "successful": sum(1 for r in results if r.status == "Success"),
            "partial": sum(1 for r in results if r.status == "Partial"), "failed": sum(1 for r in results if r.status == "Failed")
        }
        excel_bytes = generate_report_excel(results, summary)
        
    headers = {'Content-Disposition': f'attachment; filename="student_coding_report_{job_id[:8]}.xlsx"'}
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

@router.get("/history")
async def get_history(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    history = []
    for r in reports:
        results = json.loads(r.results_json)
        success_count = sum(1 for res in results if res.get("status") == "Success")
        history.append({
            "id": r.id,
            "created_at": r.created_at,
            "total_students": len(results),
            "successful": success_count
        })
    return {"reports": history}



@router.get("/template")
async def download_template():
    template_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample-data", "student_template.xlsx")
    if not os.path.exists(template_path):
        import pandas as pd
        import io
        df = pd.DataFrame([{"Reg.No": "23ECE001", "Name": "Example Student", "LeetCode Profile": "https://leetcode.com/example", "GitHub Profile": "https://github.com/example"}])
        output = io.BytesIO()
        df.to_excel(output, index=False)
        return Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={'Content-Disposition': 'attachment; filename="student_template.xlsx"'})
    return FileResponse(template_path, filename="student_template.xlsx")
