from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models import DocumentType, HireOutcome


# Applicant Schemas
class ApplicantBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str = "handshake"
    position_applied: Optional[str] = None


class ApplicantCreate(ApplicantBase):
    pass


class ApplicantResponse(ApplicantBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Document Schemas
class DocumentBase(BaseModel):
    document_type: DocumentType
    original_filename: str


class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    file_size_bytes: Optional[int]
    uploaded_at: datetime
    extracted_text: Optional[str] = None

    class Config:
        from_attributes = True


# Screening Result Schemas
class ScreeningResultResponse(BaseModel):
    id: int
    applicant_id: int
    overall_score: float
    resume_score: Optional[float]
    cover_letter_score: Optional[float]
    transcript_score: Optional[float]
    strengths: Optional[str]
    weaknesses: Optional[str]
    reasoning: Optional[str]
    recommended_for_interview: bool
    confidence_level: Optional[str]
    rank: Optional[int]
    percentile: Optional[float]
    screened_at: datetime
    ai_model_used: str

    class Config:
        from_attributes = True


# Combined Applicant with Details
class ApplicantDetail(ApplicantResponse):
    documents: List[DocumentResponse] = []
    screening_result: Optional[ScreeningResultResponse] = None

    class Config:
        from_attributes = True


# Upload Request/Response
class UploadResponse(BaseModel):
    message: str
    applicant_id: int
    documents_uploaded: int
    screening_started: bool


# Screening Summary
class ScreeningSummary(BaseModel):
    total_applicants: int
    screened_count: int
    pending_count: int
    top_15_percent_count: int
    average_score: float
    recommended_count: int


# Top Candidates Response
class TopCandidatesResponse(BaseModel):
    total_count: int
    top_percentage: float
    candidates: List[ApplicantDetail]


# Historical Hire Schemas
class HistoricalHireCreate(BaseModel):
    name: Optional[str] = None
    hired_date: Optional[datetime] = None
    position: Optional[str] = None
    resume_text: Optional[str] = None
    cover_letter_text: Optional[str] = None
    transcript_text: Optional[str] = None
    outcome: HireOutcome
    outcome_notes: Optional[str] = None
    tenure_months: Optional[int] = None
    performance_rating: Optional[float] = None


class HistoricalHireResponse(HistoricalHireCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
