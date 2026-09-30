from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import datetime
from app.database.session import get_db
from app.models.db_models import ClinicalReview, User
from app.schemas.schemas import ClinicalReviewCreate, ClinicalReviewResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Clinical Reviews"])

@router.post("", response_model=ClinicalReviewResponse)
def submit_review(
    review_in: ClinicalReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(ClinicalReview).filter(ClinicalReview.case_id == review_in.case_id).first()
    if not review:
        review = ClinicalReview(
            case_id=review_in.case_id,
            reviewer_id=current_user.id,
            review_status=review_in.review_status,
            reviewer_notes=review_in.reviewer_notes
        )
        db.add(review)
    else:
        review.reviewer_id = current_user.id
        review.review_status = review_in.review_status
        review.reviewer_notes = review_in.reviewer_notes
        review.reviewed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(review)
    return review

@router.get("/{case_id}")
def get_review_for_case(case_id: str, db: Session = Depends(get_db)):
    review = db.query(ClinicalReview).filter(ClinicalReview.case_id == case_id).first()
    if not review:
        return {"review_status": "PENDING", "reviewer_notes": "", "case_id": case_id}
    return review
