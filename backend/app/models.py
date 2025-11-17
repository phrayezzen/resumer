from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class DocumentType(str, enum.Enum):
    """Types of documents uploaded."""
    RESUME = "resume"
    COVER_LETTER = "cover_letter"
    TRANSCRIPT = "transcript"
    COMBINED = "combined"  # All documents in one PDF


class HireOutcome(str, enum.Enum):
    """Historical hire outcomes."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class Applicant(Base):
    """Model for job applicants."""
    __tablename__ = "applicants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    # Application metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Source information
    source = Column(String, default="handshake")  # handshake, linkedin, etc.
    position_applied = Column(String, nullable=True)

    # Relationships
    documents = relationship("Document", back_populates="applicant", cascade="all, delete-orphan")
    screening_result = relationship("ScreeningResult", back_populates="applicant", uselist=False, cascade="all, delete-orphan")


class Document(Base):
    """Model for uploaded documents."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False)

    # Document info
    document_type = Column(Enum(DocumentType), nullable=False)
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)

    # Extracted content
    extracted_text = Column(Text, nullable=True)

    # Metadata
    file_size_bytes = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    applicant = relationship("Applicant", back_populates="documents")


class ScreeningResult(Base):
    """Model for AI screening results."""
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False, unique=True)

    # Overall scores (0-100)
    overall_score = Column(Float, nullable=False)
    resume_score = Column(Float, nullable=True)
    cover_letter_score = Column(Float, nullable=True)
    transcript_score = Column(Float, nullable=True)

    # AI Analysis
    strengths = Column(Text, nullable=True)  # JSON array of strengths
    weaknesses = Column(Text, nullable=True)  # JSON array of weaknesses
    reasoning = Column(Text, nullable=True)  # Detailed reasoning for score

    # Recommendation
    recommended_for_interview = Column(Boolean, default=False)
    confidence_level = Column(String, nullable=True)  # high, medium, low

    # Ranking
    rank = Column(Integer, nullable=True)  # Overall rank among all applicants
    percentile = Column(Float, nullable=True)  # Percentile ranking

    # Metadata
    screened_at = Column(DateTime, default=datetime.utcnow)
    ai_model_used = Column(String, default="gpt-4o")

    # Relationships
    applicant = relationship("Applicant", back_populates="screening_result")


class HistoricalHire(Base):
    """Model for historical hiring data."""
    __tablename__ = "historical_hires"

    id = Column(Integer, primary_key=True, index=True)

    # Hire information
    name = Column(String, nullable=True)
    hired_date = Column(DateTime, nullable=True)
    position = Column(String, nullable=True)

    # Original application data
    resume_text = Column(Text, nullable=True)
    cover_letter_text = Column(Text, nullable=True)
    transcript_text = Column(Text, nullable=True)

    # Outcome
    outcome = Column(Enum(HireOutcome), nullable=False)
    outcome_notes = Column(Text, nullable=True)  # Why they were successful/unsuccessful

    # Performance data (if available)
    tenure_months = Column(Integer, nullable=True)
    performance_rating = Column(Float, nullable=True)  # 1-5 scale

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)


class JobPosting(Base):
    """Model for job postings (future use for India team)."""
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)

    # Job details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)  # US, India, etc.
    department = Column(String, nullable=True)

    # Posting info
    posted_at = Column(DateTime, default=datetime.utcnow)
    closes_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # Screening criteria
    required_skills = Column(Text, nullable=True)  # JSON array
    preferred_qualifications = Column(Text, nullable=True)
    min_gpa = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
