"""Applicant ranking and scoring service."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import ScreeningResult, Applicant
from typing import List
import logging

logger = logging.getLogger(__name__)


class ApplicantRanker:
    """Service for ranking and scoring applicants."""

    @staticmethod
    def update_rankings(db: Session):
        """
        Update rank and percentile for all screened applicants.

        This should be called after new screenings are completed.
        """
        try:
            # Get all screening results ordered by score
            results = (
                db.query(ScreeningResult)
                .order_by(ScreeningResult.overall_score.desc())
                .all()
            )

            total_count = len(results)

            if total_count == 0:
                logger.info("No screening results to rank")
                return

            # Update ranks and percentiles
            for idx, result in enumerate(results, start=1):
                result.rank = idx
                # Percentile: what percentage of applicants scored lower
                result.percentile = ((total_count - idx) / total_count) * 100

                db.add(result)

            db.commit()
            logger.info(f"Updated rankings for {total_count} applicants")

        except Exception as e:
            logger.error(f"Failed to update rankings: {str(e)}")
            db.rollback()

    @staticmethod
    def get_top_performers(
        db: Session,
        percentage: float = 15.0,
        min_score: float = 60.0
    ) -> List[Applicant]:
        """
        Get top performing applicants.

        Args:
            db: Database session
            percentage: Percentage of top applicants to return (default 15%)
            min_score: Minimum score threshold (default 60)

        Returns:
            List of top applicants
        """
        # Get total count
        total_count = db.query(ScreeningResult).count()

        if total_count == 0:
            return []

        # Calculate how many to return
        top_count = max(1, int(total_count * (percentage / 100)))

        # Get top applicants with minimum score
        applicants = (
            db.query(Applicant)
            .join(ScreeningResult)
            .filter(ScreeningResult.overall_score >= min_score)
            .order_by(ScreeningResult.overall_score.desc())
            .limit(top_count)
            .all()
        )

        return applicants

    @staticmethod
    def get_score_distribution(db: Session) -> dict:
        """
        Get distribution of scores across all applicants.

        Returns:
            Dictionary with score ranges and counts
        """
        from sqlalchemy import case

        # Define score ranges
        score_ranges = (
            db.query(
                func.count(
                    case(
                        (ScreeningResult.overall_score >= 90, 1)
                    )
                ).label("excellent_90_100"),
                func.count(
                    case(
                        (ScreeningResult.overall_score.between(80, 89.99), 1)
                    )
                ).label("very_good_80_89"),
                func.count(
                    case(
                        (ScreeningResult.overall_score.between(70, 79.99), 1)
                    )
                ).label("good_70_79"),
                func.count(
                    case(
                        (ScreeningResult.overall_score.between(60, 69.99), 1)
                    )
                ).label("fair_60_69"),
                func.count(
                    case(
                        (ScreeningResult.overall_score < 60, 1)
                    )
                ).label("below_threshold_0_59")
            )
            .first()
        )

        return {
            "90-100 (Excellent)": score_ranges[0],
            "80-89 (Very Good)": score_ranges[1],
            "70-79 (Good)": score_ranges[2],
            "60-69 (Fair)": score_ranges[3],
            "0-59 (Below Threshold)": score_ranges[4]
        }

    @staticmethod
    def calculate_composite_score(
        resume_score: float,
        cover_letter_score: float,
        transcript_score: float,
        weights: dict = None
    ) -> float:
        """
        Calculate weighted composite score.

        Args:
            resume_score: Resume score (0-100)
            cover_letter_score: Cover letter score (0-100)
            transcript_score: Transcript score (0-100)
            weights: Optional custom weights (default: resume 40%, cover letter 30%, transcript 30%)

        Returns:
            Composite score (0-100)
        """
        if weights is None:
            weights = {
                "resume": 0.40,
                "cover_letter": 0.30,
                "transcript": 0.30
            }

        # Handle missing scores
        scores = []
        weight_sum = 0

        if resume_score is not None:
            scores.append(resume_score * weights["resume"])
            weight_sum += weights["resume"]

        if cover_letter_score is not None:
            scores.append(cover_letter_score * weights["cover_letter"])
            weight_sum += weights["cover_letter"]

        if transcript_score is not None:
            scores.append(transcript_score * weights["transcript"])
            weight_sum += weights["transcript"]

        if weight_sum == 0:
            return 0.0

        # Normalize to account for missing scores
        composite = sum(scores) / weight_sum

        return round(composite, 2)
