"""Test script to upload and screen a resume."""
import sys
import time
from pathlib import Path
from sqlalchemy.orm import Session

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, init_db
from app.models import Applicant, Document, ScreeningResult, DocumentType
from app.services.file_handler import FileHandler
from app.services.pdf_extractor import PDFExtractor
from app.services.ai_screener import AIScreener

# Initialize database
init_db()

# Create services
file_handler = FileHandler()
pdf_extractor = PDFExtractor()
ai_screener = AIScreener()

# Database session
db = SessionLocal()

try:
    # Path to test resume
    resume_path = Path(__file__).parent / "resumes" / "res6b_vc (1).pdf"

    if not resume_path.exists():
        print(f"❌ Resume not found at: {resume_path}")
        sys.exit(1)

    print(f"✓ Found resume: {resume_path}")
    print(f"  Size: {resume_path.stat().st_size / 1024:.2f} KB\n")

    # Read file
    with open(resume_path, 'rb') as f:
        file_content = f.read()

    # Create applicant
    print("Creating applicant record...")
    applicant = Applicant(
        name="Test Applicant",
        email="test@example.com",
        source="handshake",
        position_applied="Software Engineer"
    )
    db.add(applicant)
    db.commit()
    db.refresh(applicant)
    print(f"✓ Created applicant ID: {applicant.id}\n")

    # Save file
    print("Saving file...")
    import asyncio
    file_path, file_size = asyncio.run(
        file_handler.save_upload(
            file_content,
            resume_path.name,
            applicant.id,
            DocumentType.RESUME.value
        )
    )
    print(f"✓ Saved to: {file_path}\n")

    # Extract text (backup)
    print("Extracting text from PDF...")
    extracted_text = pdf_extractor.extract_text(file_path)
    print(f"✓ Extracted {len(extracted_text)} characters\n")
    print("Preview of extracted text:")
    print("-" * 60)
    print(extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text)
    print("-" * 60 + "\n")

    # Save document record
    document = Document(
        applicant_id=applicant.id,
        document_type=DocumentType.RESUME,
        file_path=file_path,
        original_filename=resume_path.name,
        extracted_text=extracted_text,
        file_size_bytes=file_size
    )
    db.add(document)
    db.commit()
    print("✓ Document record saved\n")

    # AI Screening
    print("=" * 60)
    print("Starting AI screening with GPT-4o Vision...")
    print("This may take 10-30 seconds...")
    print("=" * 60 + "\n")

    start_time = time.time()

    result = ai_screener.screen_applicant(
        resume_file_path=file_path,
        resume_text=extracted_text,
        use_vision=True  # Use GPT-4o vision
    )

    elapsed_time = time.time() - start_time

    # Save screening result
    screening = ScreeningResult(
        applicant_id=applicant.id,
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

    # Display results
    print("\n" + "=" * 60)
    print("AI SCREENING RESULTS")
    print("=" * 60)
    print(f"\n📊 OVERALL SCORE: {result['overall_score']:.1f}/100")
    print(f"   Resume Score: {result.get('resume_score', 'N/A')}")
    print(f"   Cover Letter Score: {result.get('cover_letter_score', 'N/A')}")
    print(f"   Transcript Score: {result.get('transcript_score', 'N/A')}")

    print(f"\n✅ RECOMMENDATION: {'INTERVIEW' if result['recommended_for_interview'] else 'REJECT'}")
    print(f"   Confidence: {result['confidence_level'].upper()}")

    import json
    strengths = json.loads(result['strengths'])
    weaknesses = json.loads(result['weaknesses'])

    print("\n💪 STRENGTHS:")
    for i, strength in enumerate(strengths, 1):
        print(f"   {i}. {strength}")

    print("\n⚠️  WEAKNESSES:")
    for i, weakness in enumerate(weaknesses, 1):
        print(f"   {i}. {weakness}")

    print("\n📝 REASONING:")
    print("-" * 60)
    print(result['reasoning'])
    print("-" * 60)

    print(f"\n⏱️  Processing time: {elapsed_time:.2f} seconds")
    print(f"\n✓ Results saved to database (Applicant ID: {applicant.id})")

    # Summary
    print("\n" + "=" * 60)
    print("DATABASE SUMMARY")
    print("=" * 60)
    total_applicants = db.query(Applicant).count()
    total_screened = db.query(ScreeningResult).count()
    print(f"Total applicants: {total_applicants}")
    print(f"Total screened: {total_screened}")

finally:
    db.close()
