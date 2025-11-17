"""API routes for historical hire data."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import HistoricalHire
from app.schemas import HistoricalHireCreate, HistoricalHireResponse

router = APIRouter(prefix="/api/historical", tags=["historical"])


@router.post("/upload", response_model=HistoricalHireResponse)
def upload_historical_hire(
    hire_data: HistoricalHireCreate,
    db: Session = Depends(get_db)
):
    """
    Upload historical hire data for future ML training.

    This data will be used to improve screening accuracy over time.
    """
    hire = HistoricalHire(**hire_data.dict())
    db.add(hire)
    db.commit()
    db.refresh(hire)
    return hire


@router.get("/", response_model=List[HistoricalHireResponse])
def list_historical_hires(
    skip: int = 0,
    limit: int = 100,
    outcome: str = None,
    db: Session = Depends(get_db)
):
    """
    List historical hire data with optional filtering.

    Query parameters:
    - outcome: Filter by outcome (positive, negative, neutral)
    """
    query = db.query(HistoricalHire)

    if outcome:
        query = query.filter(HistoricalHire.outcome == outcome)

    hires = query.offset(skip).limit(limit).all()
    return hires


@router.get("/stats")
def get_historical_stats(db: Session = Depends(get_db)):
    """Get statistics on historical hires."""
    from sqlalchemy import func

    total_hires = db.query(HistoricalHire).count()

    outcome_counts = (
        db.query(
            HistoricalHire.outcome,
            func.count(HistoricalHire.id)
        )
        .group_by(HistoricalHire.outcome)
        .all()
    )

    avg_tenure = db.query(func.avg(HistoricalHire.tenure_months)).scalar()
    avg_performance = db.query(func.avg(HistoricalHire.performance_rating)).scalar()

    return {
        "total_hires": total_hires,
        "outcome_breakdown": {str(outcome): count for outcome, count in outcome_counts},
        "average_tenure_months": float(avg_tenure) if avg_tenure else None,
        "average_performance_rating": float(avg_performance) if avg_performance else None
    }


@router.delete("/{hire_id}")
def delete_historical_hire(hire_id: int, db: Session = Depends(get_db)):
    """Delete a historical hire record."""
    hire = db.query(HistoricalHire).filter(HistoricalHire.id == hire_id).first()

    if not hire:
        raise HTTPException(status_code=404, detail="Historical hire not found")

    db.delete(hire)
    db.commit()

    return {"message": f"Historical hire {hire_id} deleted successfully"}
