"""API routes for applicant management."""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Applicant, Document, ScreeningResult, DocumentType
from app.schemas import (
    ApplicantCreate, ApplicantDetail, ApplicantResponse,
    UploadResponse, ScreeningSummary, TopCandidatesResponse
)
from app.services.file_handler import FileHandler
from app.services.pdf_extractor import PDFExtractor
from app.services.ai_screener import AIScreener
import logging

router = APIRouter(prefix="/api/applicants", tags=["applicants"])
logger = logging.getLogger(__name__)

file_handler = FileHandler()
pdf_extractor = PDFExtractor()
ai_screener = AIScreener()


@router.post("/upload", response_model=UploadResponse)
async def upload_applicant(
    background_tasks: BackgroundTasks,
    resume: Optional[UploadFile] = File(None),
    cover_letter: Optional[UploadFile] = File(None),
    transcript: Optional[UploadFile] = File(None),
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    position_applied: Optional[str] = Form(None),
    source: str = Form("handshake"),
    db: Session = Depends(get_db)
):
    """
    Upload applicant documents and metadata.

    Accepts resume, cover letter, and transcript PDFs along with applicant information.
    Automatically triggers AI screening in the background.
    """
    # Validate at least one document is provided
    if not any([resume, cover_letter, transcript]):
        raise HTTPException(
            status_code=400,
            detail="At least one document (resume, cover letter, or transcript) must be provided"
        )

    # Create applicant record
    applicant = Applicant(
        name=name,
        email=email,
        phone=phone,
        position_applied=position_applied,
        source=source
    )
    db.add(applicant)
    db.commit()
    db.refresh(applicant)

    documents_uploaded = 0

    # Process resume
    if resume:
        await _process_document(
            resume, applicant.id, DocumentType.RESUME, db
        )
        documents_uploaded += 1

    # Process cover letter
    if cover_letter:
        await _process_document(
            cover_letter, applicant.id, DocumentType.COVER_LETTER, db
        )
        documents_uploaded += 1

    # Process transcript
    if transcript:
        await _process_document(
            transcript, applicant.id, DocumentType.TRANSCRIPT, db
        )
        documents_uploaded += 1

    # Trigger AI screening in background
    background_tasks.add_task(screen_applicant_background, applicant.id, db)

    return UploadResponse(
        message=f"Successfully uploaded documents for applicant",
        applicant_id=applicant.id,
        documents_uploaded=documents_uploaded,
        screening_started=True
    )


async def _process_document(
    file: UploadFile,
    applicant_id: int,
    doc_type: DocumentType,
    db: Session
):
    """Process and save an uploaded document."""
    # Read file content
    content = await file.read()

    # Validate PDF
    if not file_handler.validate_pdf(content, file.filename):
        raise HTTPException(status_code=400, detail=f"Invalid PDF file: {file.filename}")

    # Validate size
    if not file_handler.validate_file_size(content):
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {file.filename}. Maximum size is {file_handler.upload_dir} MB"
        )

    # Save file
    file_path, file_size = await file_handler.save_upload(
        content, file.filename, applicant_id, doc_type.value
    )

    # Extract text (for backup/search purposes)
    extracted_text = pdf_extractor.extract_text(file_path)

    # Save document record
    document = Document(
        applicant_id=applicant_id,
        document_type=doc_type,
        file_path=file_path,
        original_filename=file.filename,
        extracted_text=extracted_text,
        file_size_bytes=file_size
    )
    db.add(document)
    db.commit()


def screen_applicant_background(applicant_id: int, db: Session):
    """Background task to screen applicant using AI."""
    try:
        # Get applicant and documents
        applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
        if not applicant:
            logger.error(f"Applicant {applicant_id} not found")
            return

        # Get document paths
        resume_path = None
        cover_letter_path = None
        transcript_path = None
        resume_text = None
        cover_letter_text = None
        transcript_text = None

        for doc in applicant.documents:
            if doc.document_type == DocumentType.RESUME:
                resume_path = doc.file_path
                resume_text = doc.extracted_text
            elif doc.document_type == DocumentType.COVER_LETTER:
                cover_letter_path = doc.file_path
                cover_letter_text = doc.extracted_text
            elif doc.document_type == DocumentType.TRANSCRIPT:
                transcript_path = doc.file_path
                transcript_text = doc.extracted_text

        # Screen using AI (prefer vision mode with PDFs)
        result = ai_screener.screen_applicant(
            resume_file_path=resume_path,
            cover_letter_file_path=cover_letter_path,
            transcript_file_path=transcript_path,
            resume_text=resume_text,
            cover_letter_text=cover_letter_text,
            transcript_text=transcript_text,
            use_vision=True  # Use GPT-4o vision by default
        )

        # Save screening result
        screening = ScreeningResult(
            applicant_id=applicant_id,
            overall_score=result["overall_score"],
            resume_score=result.get("resume_score"),
            cover_letter_score=result.get("cover_letter_score"),
            transcript_score=result.get("transcript_score"),
            strengths=result["strengths"],
            weaknesses=result["weaknesses"],
            reasoning=result["reasoning"],
            recommended_for_interview=result["recommended_for_interview"],
            confidence_level=result["confidence_level"]
        )
        db.add(screening)
        db.commit()

        logger.info(f"Screened applicant {applicant_id} - Score: {result['overall_score']}")

    except Exception as e:
        logger.error(f"Failed to screen applicant {applicant_id}: {str(e)}")
        db.rollback()


@router.get("/", response_model=List[ApplicantDetail])
def list_applicants(
    skip: int = 0,
    limit: int = 100,
    min_score: Optional[float] = None,
    recommended_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    List all applicants with optional filtering.

    Query parameters:
    - skip: Number of records to skip (pagination)
    - limit: Maximum number of records to return
    - min_score: Filter by minimum overall score
    - recommended_only: Show only recommended candidates
    """
    query = db.query(Applicant)

    # Apply filters if screening results exist
    if min_score is not None or recommended_only:
        query = query.join(ScreeningResult)
        if min_score is not None:
            query = query.filter(ScreeningResult.overall_score >= min_score)
        if recommended_only:
            query = query.filter(ScreeningResult.recommended_for_interview == True)

    # Order by score (highest first) if screening exists
    query = query.outerjoin(ScreeningResult).order_by(
        ScreeningResult.overall_score.desc().nullslast()
    )

    applicants = query.offset(skip).limit(limit).all()
    return applicants


@router.get("/top-candidates", response_model=TopCandidatesResponse)
def get_top_candidates(
    percentage: float = 15.0,
    db: Session = Depends(get_db)
):
    """
    Get top X% of applicants based on screening scores.

    Default is top 15% as specified in requirements.
    """
    # Get total screened applicants
    total_screened = db.query(ScreeningResult).count()

    if total_screened == 0:
        return TopCandidatesResponse(
            total_count=0,
            top_percentage=percentage,
            candidates=[]
        )

    # Calculate how many to return
    top_count = max(1, int(total_screened * (percentage / 100)))

    # Get top applicants
    top_applicants = (
        db.query(Applicant)
        .join(ScreeningResult)
        .order_by(ScreeningResult.overall_score.desc())
        .limit(top_count)
        .all()
    )

    return TopCandidatesResponse(
        total_count=total_screened,
        top_percentage=percentage,
        candidates=top_applicants
    )


@router.get("/analytics/summary", response_model=ScreeningSummary)
def get_screening_summary(db: Session = Depends(get_db)):
    """Get summary statistics of all applicant screenings."""
    total_applicants = db.query(Applicant).count()
    screened_count = db.query(ScreeningResult).count()
    pending_count = total_applicants - screened_count

    # Calculate top 15% count
    top_15_count = max(1, int(screened_count * 0.15)) if screened_count > 0 else 0

    # Get average score
    from sqlalchemy import func
    avg_score_result = db.query(func.avg(ScreeningResult.overall_score)).scalar()
    avg_score = float(avg_score_result) if avg_score_result else 0.0

    # Get recommended count
    recommended_count = db.query(ScreeningResult).filter(
        ScreeningResult.recommended_for_interview == True
    ).count()

    return ScreeningSummary(
        total_applicants=total_applicants,
        screened_count=screened_count,
        pending_count=pending_count,
        top_15_percent_count=top_15_count,
        average_score=avg_score,
        recommended_count=recommended_count
    )


@router.get("/{applicant_id}", response_model=ApplicantDetail)
def get_applicant(applicant_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific applicant."""
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    return applicant


@router.delete("/{applicant_id}")
async def delete_applicant(applicant_id: int, db: Session = Depends(get_db)):
    """Delete an applicant and all associated data."""
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    # Delete files
    await file_handler.delete_applicant_files(applicant_id)

    # Delete from database (cascade will handle related records)
    db.delete(applicant)
    db.commit()

    return {"message": f"Applicant {applicant_id} deleted successfully"}
