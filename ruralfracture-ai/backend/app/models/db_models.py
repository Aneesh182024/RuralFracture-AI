import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="HEALTHCARE_WORKER")  # ADMIN, HEALTHCARE_WORKER, DOCTOR
    hospital = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reviews = relationship("ClinicalReview", back_populates="reviewer")


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(String, primary_key=True)  # e.g. RF-PAT-001
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    hospital_name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    photo_path = Column(String, nullable=True)  # Separate patient photo (not used for ML)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cases = relationship("XRayCase", back_populates="patient", cascade="all, delete-orphan")


class XRayCase(Base):
    __tablename__ = "xray_cases"

    case_id = Column(String, primary_key=True)  # e.g. RF-2026-0001
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    body_region = Column(String, nullable=False)  # Wrist, Forearm, Femur, Ankle, Ribs, Hand, Foot, Shoulder
    image_path = Column(String, nullable=False)  # Original X-ray image
    enhanced_image_path = Column(String, nullable=True)  # Enhanced X-ray image
    examination_date = Column(String, nullable=False)
    image_quality_score = Column(Float, nullable=True)  # 0.0 to 100.0
    image_quality_status = Column(String, nullable=True)  # ACCEPTABLE, POOR IMAGE QUALITY
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="cases")
    predictions = relationship("AIPrediction", back_populates="case", cascade="all, delete-orphan")
    fracture_detail = relationship("FractureDetail", back_populates="case", uselist=False, cascade="all, delete-orphan")
    clinical_reviews = relationship("ClinicalReview", back_populates="case", cascade="all, delete-orphan")


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    prediction_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("xray_cases.case_id"), nullable=False)
    model_name = Column(String, default="EfficientNet-B0")
    model_version = Column(String, default="v1.0")
    prediction = Column(String, nullable=False)  # Possible Fracture, No Obvious Fracture
    fracture_probability = Column(Float, nullable=False)  # 0.0 to 1.0
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    priority = Column(String, nullable=False)  # HIGH, MEDIUM, LOW, GRAY
    gradcam_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("XRayCase", back_populates="predictions")


class FractureDetail(Base):
    __tablename__ = "fracture_details"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("xray_cases.case_id"), nullable=False)
    fracture_present = Column(Boolean, default=False)
    fracture_type = Column(String, nullable=True)  # Distal Radius, Shaft, Transverse, Hairline, None
    fracture_region = Column(String, nullable=True)
    clinical_notes = Column(Text, nullable=True)

    case = relationship("XRayCase", back_populates="fracture_detail")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    model_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String, nullable=False, default="EfficientNet-B0")
    version = Column(String, nullable=False)
    training_dataset = Column(String, nullable=False)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    specificity = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ClinicalReview(Base):
    __tablename__ = "clinical_reviews"

    review_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("xray_cases.case_id"), nullable=False)
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    review_status = Column(String, nullable=False, default="PENDING")  # PENDING, CONFIRMED_FRACTURE, CONFIRMED_NO_FRACTURE, NEEDS_RETAKE
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("XRayCase", back_populates="clinical_reviews")
    reviewer = relationship("User", back_populates="reviews")


class AssistantConversation(Base):
    __tablename__ = "assistant_conversations"

    conversation_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True)
    case_id = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
