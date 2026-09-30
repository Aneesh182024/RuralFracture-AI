from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
from app.database.session import get_db
from app.models.db_models import Patient, User
from app.schemas.schemas import PatientCreate, PatientResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.post("", response_model=PatientResponse)
def create_patient(
    patient_id: str = Form(...),
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    hospital_name: str = Form(...),
    department: Optional[str] = Form("Radiology"),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if existing:
        return existing

    photo_path = None
    if photo and photo.filename:
        upload_dir = os.path.join("uploads", "patients")
        os.makedirs(upload_dir, exist_ok=True)
        ext = os.path.splitext(photo.filename)[1]
        saved_filename = f"{patient_id}_{uuid.uuid4().hex[:6]}{ext}"
        full_path = os.path.join(upload_dir, saved_filename)
        with open(full_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_path = full_path

    patient = Patient(
        patient_id=patient_id,
        name=name,
        age=age,
        gender=gender,
        hospital_name=hospital_name,
        department=department,
        photo_path=photo_path
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("", response_model=List[PatientResponse])
def list_patients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Patient).order_by(Patient.created_at.desc()).all()

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
