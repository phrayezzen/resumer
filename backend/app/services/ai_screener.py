"""AI-powered resume screening service using OpenAI GPT-4o."""
from openai import OpenAI
from app.config import settings
import json
import logging
import base64
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class AIScreener:
    """Service for AI-powered resume screening."""

    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o"

    def screen_applicant(
        self,
        resume_text: Optional[str] = None,
        cover_letter_text: Optional[str] = None,
        transcript_text: Optional[str] = None,
        resume_file_path: Optional[str] = None,
        cover_letter_file_path: Optional[str] = None,
        transcript_file_path: Optional[str] = None,
        job_requirements: Optional[str] = None,
        use_vision: bool = True
    ) -> Dict:
        """
        Screen an applicant using AI analysis of their documents.

        Args:
            resume_text: Extracted resume text (for text-only mode)
            cover_letter_text: Extracted cover letter text (for text-only mode)
            transcript_text: Extracted transcript text (for text-only mode)
            resume_file_path: Path to resume PDF (for vision mode)
            cover_letter_file_path: Path to cover letter PDF (for vision mode)
            transcript_file_path: Path to transcript PDF (for vision mode)
            job_requirements: Specific job requirements (optional)
            use_vision: Whether to use GPT-4o vision to read PDFs directly (default True)

        Returns:
            Dictionary with screening results including scores and analysis
        """
        try:
            if use_vision and any([resume_file_path, cover_letter_file_path, transcript_file_path]):
                # Use GPT-4o vision to analyze PDF documents directly
                response = self._screen_with_vision(
                    resume_file_path, cover_letter_file_path,
                    transcript_file_path, job_requirements
                )
            else:
                # Use text-based screening
                response = self._screen_with_text(
                    resume_text, cover_letter_text,
                    transcript_text, job_requirements
                )


            # Parse and normalize response
            result = json.loads(response.choices[0].message.content)
            return self._normalize_result(result)

        except Exception as e:
            logger.error(f"AI screening failed: {str(e)}")
            # Return a default low score if screening fails
            return {
                "overall_score": 30.0,
                "resume_score": 30.0,
                "cover_letter_score": 30.0,
                "transcript_score": 30.0,
                "strengths": json.dumps(["Unable to analyze"]),
                "weaknesses": json.dumps(["Screening failed"]),
                "reasoning": f"Automated screening encountered an error: {str(e)}",
                "recommended_for_interview": False,
                "confidence_level": "low"
            }

    def _encode_pdf_to_base64(self, file_path: str) -> str:
        """Encode PDF file to base64 for vision API."""
        with open(file_path, "rb") as pdf_file:
            return base64.b64encode(pdf_file.read()).decode('utf-8')

    def _screen_with_vision(
        self,
        resume_path: Optional[str],
        cover_letter_path: Optional[str],
        transcript_path: Optional[str],
        job_requirements: Optional[str]
    ):
        """
        Screen applicant using GPT-4o vision to read PDFs.

        Note: OpenAI's vision API requires converting PDFs to images first.
        For MVP, we'll fall back to text-based screening.
        Future: Add PDF->image conversion using pdf2image library.
        """
        # For now, extract text and use text-based screening
        # This is more reliable and cost-effective
        from app.services.pdf_extractor import PDFExtractor
        extractor = PDFExtractor()

        resume_text = extractor.extract_text(resume_path) if resume_path else None
        cover_letter_text = extractor.extract_text(cover_letter_path) if cover_letter_path else None
        transcript_text = extractor.extract_text(transcript_path) if transcript_path else None

        return self._screen_with_text(
            resume_text, cover_letter_text, transcript_text, job_requirements
        )

    def _screen_with_text(
        self,
        resume_text: Optional[str],
        cover_letter_text: Optional[str],
        transcript_text: Optional[str],
        job_requirements: Optional[str]
    ):
        """Screen applicant using extracted text."""
        prompt = self._build_screening_prompt(
            resume_text, cover_letter_text, transcript_text, job_requirements
        )

        return self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": self._get_system_prompt()
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI screener."""
        return """You are an expert HR professional and recruiter with 15+ years of experience screening job applicants.

Your task is to evaluate job applicants based on their resume, cover letter, and academic transcript. You should assess:

1. **Resume Quality** (0-100):
   - Relevant work experience and internships
   - Skills alignment with typical entry-level professional roles
   - Leadership and extracurricular activities
   - Professionalism and presentation
   - Clear career progression or growth

2. **Cover Letter Quality** (0-100):
   - Writing quality and professionalism
   - Genuine interest and enthusiasm
   - Company research and fit
   - Clear communication skills
   - Specific examples and achievements

3. **Academic Transcript** (0-100):
   - GPA (consider 3.5+ as strong, 3.0-3.5 as good, below 3.0 as concern)
   - Relevant coursework for business/professional roles
   - Consistency of performance
   - Academic rigor and challenging courses
   - Upward or stable trend in grades

4. **Overall Assessment**:
   - Synthesize all factors into an overall score (0-100)
   - Identify key strengths and weaknesses
   - Provide clear reasoning for your decision
   - Recommend whether this candidate should be interviewed
   - Assess your confidence level (high/medium/low)

Be thorough, fair, and objective. Consider that this is for entry-level positions targeting recent undergraduates.

You MUST respond in valid JSON format with this exact structure:
{
  "overall_score": <number 0-100>,
  "resume_score": <number 0-100 or null>,
  "cover_letter_score": <number 0-100 or null>,
  "transcript_score": <number 0-100 or null>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "reasoning": "detailed explanation of scoring decision",
  "recommended_for_interview": <true or false>,
  "confidence_level": "high" | "medium" | "low"
}"""

    def _build_screening_prompt(
        self,
        resume_text: Optional[str],
        cover_letter_text: Optional[str],
        transcript_text: Optional[str],
        job_requirements: Optional[str]
    ) -> str:
        """Build the screening prompt from applicant documents."""
        prompt_parts = ["Please evaluate this job applicant:\n"]

        if job_requirements:
            prompt_parts.append(f"**JOB REQUIREMENTS:**\n{job_requirements}\n\n")

        if resume_text:
            prompt_parts.append(f"**RESUME:**\n{resume_text[:4000]}\n\n")  # Limit length
        else:
            prompt_parts.append("**RESUME:** Not provided\n\n")

        if cover_letter_text:
            prompt_parts.append(f"**COVER LETTER:**\n{cover_letter_text[:2000]}\n\n")
        else:
            prompt_parts.append("**COVER LETTER:** Not provided\n\n")

        if transcript_text:
            prompt_parts.append(f"**TRANSCRIPT:**\n{transcript_text[:2000]}\n\n")
        else:
            prompt_parts.append("**TRANSCRIPT:** Not provided\n\n")

        prompt_parts.append(
            "Provide a comprehensive evaluation in the JSON format specified in the system prompt."
        )

        return "".join(prompt_parts)

    def _normalize_result(self, result: Dict) -> Dict:
        """Normalize and validate the AI screening result."""
        # Ensure all required fields exist
        normalized = {
            "overall_score": float(result.get("overall_score", 50.0)),
            "resume_score": float(result.get("resume_score")) if result.get("resume_score") is not None else None,
            "cover_letter_score": float(result.get("cover_letter_score")) if result.get("cover_letter_score") is not None else None,
            "transcript_score": float(result.get("transcript_score")) if result.get("transcript_score") is not None else None,
            "strengths": json.dumps(result.get("strengths", [])),
            "weaknesses": json.dumps(result.get("weaknesses", [])),
            "reasoning": result.get("reasoning", "No reasoning provided"),
            "recommended_for_interview": bool(result.get("recommended_for_interview", False)),
            "confidence_level": result.get("confidence_level", "medium")
        }

        # Clamp scores to 0-100 range
        for key in ["overall_score", "resume_score", "cover_letter_score", "transcript_score"]:
            if normalized[key] is not None:
                normalized[key] = max(0.0, min(100.0, normalized[key]))

        return normalized

    def batch_screen_applicants(
        self,
        applicants: List[Dict],
        job_requirements: Optional[str] = None
    ) -> List[Dict]:
        """
        Screen multiple applicants in batch.

        Args:
            applicants: List of applicant dictionaries with document texts
            job_requirements: Optional job requirements

        Returns:
            List of screening results
        """
        results = []
        for applicant in applicants:
            result = self.screen_applicant(
                resume_text=applicant.get("resume_text"),
                cover_letter_text=applicant.get("cover_letter_text"),
                transcript_text=applicant.get("transcript_text"),
                job_requirements=job_requirements
            )
            result["applicant_id"] = applicant.get("id")
            results.append(result)

        return results
