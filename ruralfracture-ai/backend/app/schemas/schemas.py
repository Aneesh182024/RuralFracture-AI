from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- User & Auth Schemas ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "HEALTHCARE_WORKER"  # ADMIN, HEALTHCARE_WORKER, DOCTOR
    hospital: Optional[str] = "Regional Health Center"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    hospital: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# --- Patient Schemas ---
class PatientCreate(BaseModel):
    patient_id: str
    name: str
    age: int
    gender: str
    hospital_name: str
    department: Optional[str] = "Radiology"

class PatientResponse(BaseModel):
    patient_id: str
    name: str
    age: int
    gender: str
    hospital_name: str
    department: Optional[str]
    photo_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Case Schemas ---
class CaseCreate(BaseModel):
    patient_id: str
    body_region: str
    examination_date: str
    clinical_notes: Optional[str] = None

class CaseResponse(BaseModel):
    case_id: str
    patient_id: str
    body_region: str
    image_path: str
    enhanced_image_path: Optional[str]
    examination_date: str
    image_quality_score: Optional[float]
    image_quality_status: Optional[str]
    created_at: datetime
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True


# --- AI Prediction Schemas ---
class AIPredictionResponse(BaseModel):
    prediction_id: str
    case_id: str
    model_name: str
    model_version: str
    prediction: str
    fracture_probability: float
    confidence: float
    priority: str
    gradcam_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Image Quality & Enhancement Schemas ---
class QualityAssessmentResponse(BaseModel):
    score: float
    status: str  # ACCEPTABLE, POOR IMAGE QUALITY
    blur_score: float
    contrast_score: float
    exposure_score: float
    noise_score: float
    recommendation: str

class EnhanceImageResponse(BaseModel):
    case_id: str
    original_image_url: str
    enhanced_image_url: str
    quality_score: float
    quality_status: str


# --- Clinical Review Schemas ---
class ClinicalReviewCreate(BaseModel):
    case_id: str
    review_status: str  # CONFIRMED_FRACTURE, CONFIRMED_NO_FRACTURE, NEEDS_RETAKE
    reviewer_notes: Optional[str] = ""

class ClinicalReviewResponse(BaseModel):
    review_id: str
    case_id: str
    reviewer_id: str
    review_status: str
    reviewer_notes: Optional[str]
    reviewed_at: datetime

    class Config:
        from_attributes = True


# --- Model Version & Metrics Schemas ---
class ModelVersionResponse(BaseModel):
    model_id: str
    model_name: str
    version: str
    training_dataset: str
    accuracy: float
    precision: float
    recall: float
    specificity: float
    f1_score: float
    roc_auc: float
    created_at: datetime

    class Config:
        from_attributes = True


# --- AI Assistant Schemas ---
class ChatMessage(BaseModel):
    message: str
    case_id: Optional[str] = None
    current_page: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    case_id: Optional[str] = None
    quick_actions: Optional[List[str]] = []
