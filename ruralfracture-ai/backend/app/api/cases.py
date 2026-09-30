from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.db_models import XRayCase, Patient, AIPrediction, ClinicalReview, User
from app.schemas.schemas import CaseResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/cases", tags=["Cases"])

@router.get("", response_model=List[CaseResponse])
def list_cases(
    body_region: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(XRayCase)
    if body_region:
        query = query.filter(XRayCase.body_region == body_region)
    if search:
        query = query.filter(
            (XRayCase.case_id.contains(search)) | (XRayCase.patient_id.contains(search))
        )
    return query.order_by(XRayCase.created_at.desc()).all()

@router.get("/{case_id}")
def get_case_detail(case_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(XRayCase).filter(XRayCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    patient = db.query(Patient).filter(Patient.patient_id == case.patient_id).first()
    prediction = db.query(AIPrediction).filter(AIPrediction.case_id == case_id).order_by(AIPrediction.created_at.desc()).first()
    review = db.query(ClinicalReview).filter(ClinicalReview.case_id == case_id).order_by(ClinicalReview.reviewed_at.desc()).first()

    return {
        "case": case,
        "patient": patient,
        "prediction": prediction,
        "review": review
    }
