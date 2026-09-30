from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

class StudentBase(BaseModel):
    reg_no: str
    name: str
    leetcode_url: str
    github_url: str

class StudentValidation(StudentBase):
    is_valid: bool = True
    validation_message: Optional[str] = None
    leetcode_username: Optional[str] = None
    github_username: Optional[str] = None

class ValidationResponse(BaseModel):
    job_id: str
    total_students: int
    valid_students: int
    invalid_students: int
    preview: List[StudentValidation]

class StudentResult(BaseModel):
    reg_no: str
    name: str
    leetcode_url: str
    github_url: str
    easy: int = 0
    medium: int = 0
    hard: int = 0
    total_solved: int = 0
    repo_count: int = 0
    status: str = "Pending"
    error_message: Optional[str] = None

class JobStatus(BaseModel):
    job_id: str
    status: str # "processing", "completed", "failed"
    total: int
    processed: int
    successful: int
    partial: int
    failed: int

class JobResultResponse(BaseModel):
    job_id: str
    status: str
    results: List[StudentResult]
    summary: dict
