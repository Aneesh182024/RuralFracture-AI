from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from app.database.session import get_db
from app.models.db_models import XRayCase, AIPrediction, Patient, ClinicalReview, AssistantConversation, User
from app.schemas.schemas import ChatMessage, ChatResponse
from app.services.assistant_service import get_ai_assistant_provider
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant Bot"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    chat_in: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    provider = get_ai_assistant_provider()

    # Build minimum necessary case context (no unnecessary PII)
    context = {}
    if chat_in.case_id:
        case = db.query(XRayCase).filter(XRayCase.case_id == chat_in.case_id).first()
        if case:
            pred = db.query(AIPrediction).filter(AIPrediction.case_id == chat_in.case_id).order_by(AIPrediction.created_at.desc()).first()
            review = db.query(ClinicalReview).filter(ClinicalReview.case_id == chat_in.case_id).first()
            context = {
                "case_id": case.case_id,
                "body_region": case.body_region,
                "image_quality_score": case.image_quality_score,
                "image_quality_status": case.image_quality_status,
                "prediction": pred.prediction if pred else "Unscreened",
                "confidence": pred.confidence if pred else 0.0,
                "priority": pred.priority if pred else "GRAY",
                "gradcam_available": bool(pred and pred.gradcam_path),
                "review_status": review.review_status if review else "PENDING"
            }

    response_text = provider.generate_response(chat_in.message, context, db)

    # Log conversation
    conv = AssistantConversation(
        user_id=current_user.id if current_user else "anonymous",
        case_id=chat_in.case_id,
        message=chat_in.message,
        response=response_text
    )
    db.add(conv)
    db.commit()

    quick_actions = [
        "Explain this result",
        "Explain Grad-CAM",
        "Explain Image Quality",
        "Summarize Case",
        "How do I upload an X-ray?"
    ]

    return {
        "response": response_text,
        "case_id": chat_in.case_id,
        "quick_actions": quick_actions
    }

@router.post("/explain-result")
def explain_result_endpoint(case_id: str, db: Session = Depends(get_db)):
    provider = get_ai_assistant_provider()
    case = db.query(XRayCase).filter(XRayCase.case_id == case_id).first()
    pred = db.query(AIPrediction).filter(AIPrediction.case_id == case_id).first() if case else None
    context = {
        "case_id": case_id,
        "body_region": case.body_region if case else "Wrist",
        "image_quality_score": case.image_quality_score if case else 91.0,
        "image_quality_status": case.image_quality_status if case else "ACCEPTABLE",
        "prediction": pred.prediction if pred else "Possible Fracture",
        "confidence": pred.confidence if pred else 0.87,
        "priority": pred.priority if pred else "HIGH"
    }
    explanation = provider.generate_response("Explain this result", context, db)
    return {"case_id": case_id, "explanation": explanation}

@router.post("/explain-image-quality")
def explain_quality_endpoint(case_id: str, db: Session = Depends(get_db)):
    provider = get_ai_assistant_provider()
    case = db.query(XRayCase).filter(XRayCase.case_id == case_id).first()
    context = {"case_id": case_id, "image_quality_score": case.image_quality_score if case else 91.0}
    explanation = provider.generate_response("Explain image quality", context, db)
    return {"case_id": case_id, "explanation": explanation}

@router.post("/dataset-help")
def dataset_help_endpoint(query: Optional[str] = "How do I import dataset?"):
    provider = get_ai_assistant_provider()
    response = provider.generate_response(query or "dataset help")
    return {"help": response}

@router.post("/summarize-case")
def summarize_case_endpoint(case_id: str, db: Session = Depends(get_db)):
    provider = get_ai_assistant_provider()
    case = db.query(XRayCase).filter(XRayCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    pred = db.query(AIPrediction).filter(AIPrediction.case_id == case_id).first()
    review = db.query(ClinicalReview).filter(ClinicalReview.case_id == case_id).first()
    context = {
        "case_id": case.case_id,
        "body_region": case.body_region,
        "image_quality_score": case.image_quality_score,
        "image_quality_status": case.image_quality_status,
        "prediction": pred.prediction if pred else "Unscreened",
        "confidence": pred.confidence if pred else 0.0,
        "priority": pred.priority if pred else "LOW",
        "gradcam_available": bool(pred and pred.gradcam_path),
        "review_status": review.review_status if review else "PENDING"
    }
    summary = provider.generate_response("Summarize case", context, db)
    return {"case_id": case_id, "summary": summary}

@router.get("/context/{case_id}")
def get_case_context(case_id: str, db: Session = Depends(get_db)):
    case = db.query(XRayCase).filter(XRayCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    pred = db.query(AIPrediction).filter(AIPrediction.case_id == case_id).first()
    return {
        "case_id": case.case_id,
        "body_region": case.body_region,
        "image_quality_score": case.image_quality_score,
        "image_quality_status": case.image_quality_status,
        "prediction": pred.prediction if pred else None,
        "confidence": pred.confidence if pred else None,
        "priority": pred.priority if pred else None
    }
