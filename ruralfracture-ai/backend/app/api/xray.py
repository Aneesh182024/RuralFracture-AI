from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Body
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import io
import shutil
import uuid
import datetime
import cv2
import numpy as np
from PIL import Image

from app.database.session import get_db
from app.models.db_models import XRayCase, Patient, FractureDetail, User
try:
    from ml.preprocessing.image_processor import ImageProcessor
except ImportError:
    from app.ml.preprocessing.image_processor import ImageProcessor
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/xray", tags=["X-ray Upload & Processing"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

class EnhanceRequest(BaseModel):
    case_id: str

@router.post("/upload")
def upload_xray(
    patient_id: str = Form(...),
    body_region: str = Form(...),
    examination_date: Optional[str] = Form(None),
    clinical_notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{ext}'. Supported formats are JPG, JPEG, and PNG."
        )

    # 2. Read file bytes and check for empty file
    file_bytes = file.file.read()
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty (0 bytes). Please upload a valid X-ray image."
        )

    # Check maximum size (15MB)
    if len(file_bytes) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 15MB limit. Please compress or select a smaller image."
        )

    # 3. Validate image integrity & corruption via PIL & OpenCV
    try:
        pil_img = Image.open(io.BytesIO(file_bytes))
        pil_img.verify()
        # Re-open for size check because verify() mutates PIL object
        pil_img = Image.open(io.BytesIO(file_bytes))
        width, height = pil_img.size
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Corrupted or invalid image file. Unable to decode image ({str(e)})."
        )

    np_arr = np.frombuffer(file_bytes, np.uint8)
    cv_img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if cv_img is None:
        raise HTTPException(
            status_code=400,
            detail="Corrupted X-ray image file. Unable to decode radiographic data."
        )

    # 4. Check minimum resolution
    if width < 100 or height < 100:
        raise HTTPException(
            status_code=400,
            detail=f"Image resolution too low ({width}x{height} px). Minimum required resolution is 100x100 pixels."
        )

    # Ensure patient exists or auto-create basic record
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        patient = Patient(
            patient_id=patient_id,
            name=f"Patient {patient_id}",
            age=45,
            gender="Unspecified",
            hospital_name=current_user.hospital or "Regional Health Center",
            department="Radiology"
        )
        db.add(patient)
        db.commit()

    case_id = f"RF-{datetime.datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    exam_date = examination_date or datetime.date.today().isoformat()

    # Save original X-ray image
    upload_dir = os.path.join("uploads", "original")
    os.makedirs(upload_dir, exist_ok=True)
    orig_path = os.path.join(upload_dir, f"{case_id}{ext}")

    with open(orig_path, "wb") as buffer:
        buffer.write(file_bytes)

    # Assess OpenCV image quality
    quality_result = ImageProcessor.assess_quality(orig_path)

    # Save case record to DB
    case = XRayCase(
        case_id=case_id,
        patient_id=patient_id,
        body_region=body_region,
        image_path=orig_path,
        enhanced_image_path=None,
        examination_date=exam_date,
        image_quality_score=quality_result["score"],
        image_quality_status=quality_result["status"]
    )
    db.add(case)

    # Save clinical notes in FractureDetail
    if clinical_notes:
        detail = FractureDetail(
            case_id=case_id,
            clinical_notes=clinical_notes
        )
        db.add(detail)

    db.commit()
    db.refresh(case)

    return {
        "case_id": case_id,
        "patient_id": patient_id,
        "body_region": body_region,
        "image_quality": quality_result,
        "original_image_path": orig_path,
        "enhanced_image_path": None,
        "examination_date": exam_date
    }

@router.post("/enhance")
def enhance_existing_xray(
    request: Optional[EnhanceRequest] = None,
    case_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    target_id = (request.case_id if request and request.case_id else None) or case_id
    if not target_id:
        raise HTTPException(status_code=400, detail="case_id parameter is required")

    case = db.query(XRayCase).filter(XRayCase.case_id == target_id).first()
    if not case or not os.path.exists(case.image_path):
        raise HTTPException(status_code=404, detail="X-ray case or image file not found")

    if case.image_quality_status == "POOR IMAGE QUALITY" or (case.image_quality_score is not None and case.image_quality_score < 50.0):
        raise HTTPException(
            status_code=400,
            detail="Cannot enhance image: Image quality assessment failed (POOR IMAGE QUALITY). Please upload a clearer X-ray image."
        )

    enhanced_dir = os.path.join("uploads", "enhanced")
    os.makedirs(enhanced_dir, exist_ok=True)
    enhanced_path = os.path.join(enhanced_dir, f"{target_id}_enhanced.png")
    
    try:
        ImageProcessor.enhance_xray(case.image_path, enhanced_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image enhancement pipeline failed: {str(e)}")

    case.enhanced_image_path = enhanced_path
    db.commit()

    return {
        "case_id": target_id,
        "original_image_path": case.image_path,
        "enhanced_image_path": enhanced_path,
        "status": "SUCCESS"
    }

@router.get("/{case_id}")
def get_xray_info(case_id: str, db: Session = Depends(get_db)):
    case = db.query(XRayCase).filter(XRayCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="X-ray case not found")
    quality = ImageProcessor.assess_quality(case.image_path) if os.path.exists(case.image_path) else None
    return {
        "case": case,
        "quality_assessment": quality
    }

