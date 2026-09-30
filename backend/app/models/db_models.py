from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    reports = relationship("Report", back_populates="owner")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)  # Will use job_id as primary key
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Store the final result JSON payload (JobResultResponse) as a text column to easily re-generate excel
    results_json = Column(Text) 
    
    owner = relationship("User", back_populates="reports")


class StudentSnapshot(Base):
    __tablename__ = "student_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    reg_no = Column(String, index=True)
    easy = Column(Integer)
    medium = Column(Integer)
    hard = Column(Integer)
    total_solved = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User")
