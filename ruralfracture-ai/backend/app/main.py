import os
import sys
import datetime

# Add root directory and backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(backend_dir, "..", ".."))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.abspath(os.path.join(backend_dir, "..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database.session import Base, engine, SessionLocal
from app.models.db_models import User, Patient, XRayCase, AIPrediction, ClinicalReview, FractureDetail, ModelVersion
from app.auth.security import get_password_hash
from app.api import auth, patients, cases, xray, ai, dataset, models, reviews, assistant

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RuralFracture-AI API",
    description="Enhance. Detect. Prioritize. AI-assisted fracture screening platform for rural healthcare.",
    version="1.0.0"
)

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist & mount static uploads route
os.makedirs("uploads/original", exist_ok=True)
os.makedirs("uploads/enhanced", exist_ok=True)
os.makedirs("uploads/gradcam", exist_ok=True)
os.makedirs("uploads/patients", exist_ok=True)
os.makedirs("uploads/datasets", exist_ok=True)
os.makedirs("models", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API Routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(cases.router)
app.include_router(xray.router)
app.include_router(ai.router)
app.include_router(dataset.router)
app.include_router(models.router)
app.include_router(reviews.router)
app.include_router(assistant.router)


@app.on_event("startup")
def seed_initial_data():
    """
    Seeds default administrative and healthcare worker accounts, benchmark ML model version,
    and realistic sample X-ray cases for instant demonstration.
    """
    db = SessionLocal()
    try:
        # Seed Users
        if db.query(User).count() == 0:
            users = [
                User(
                    name="System Admin",
                    email="admin@ruralfracture.ai",
                    password_hash=get_password_hash("password123"),
                    role="ADMIN",
                    hospital="Central Health Authority"
                ),
                User(
                    name="Healthcare Worker (Nurse Mary)",
                    email="worker@ruralfracture.ai",
                    password_hash=get_password_hash("password123"),
                    role="HEALTHCARE_WORKER",
                    hospital="Primary Rural Clinic"
                ),
                User(
                    name="Dr. Aris Thorne (Radiologist)",
                    email="doctor@ruralfracture.ai",
                    password_hash=get_password_hash("password123"),
                    role="DOCTOR",
                    hospital="District General Hospital"
                )
            ]
            db.add_all(users)
            db.commit()

        # Seed Benchmark Model Version
        if db.query(ModelVersion).count() == 0:
            model = ModelVersion(
                model_name="EfficientNet-B0",
                version="v1.0",
                training_dataset="RuralFracture_Benchmark_XRay_1000",
                accuracy=0.9140,
                precision=0.8950,
                recall=0.9280,
                specificity=0.9010,
                f1_score=0.9110,
                roc_auc=0.9520
            )
            db.add(model)
            db.commit()

        # Seed Initial Sample Patients & X-Ray Cases for demo
        if db.query(Patient).count() == 0:
            import cv2, numpy as np

            demo_cases_data = [
                {"pid": "RF-PAT-001", "name": "Aarav Sharma", "age": 42, "gender": "Male", "cid": "RF-2026-0001", "region": "Wrist", "pred": "Possible Fracture", "prob": 0.87, "qual": 91.0, "status": "ACCEPTABLE", "prio": "HIGH", "rev": "PENDING"},
                {"pid": "RF-PAT-002", "name": "Priya Patel", "age": 31, "gender": "Female", "cid": "RF-2026-0002", "region": "Forearm", "pred": "No Obvious Fracture", "prob": 0.12, "qual": 94.0, "status": "ACCEPTABLE", "prio": "LOW", "rev": "CONFIRMED_NO_FRACTURE"},
                {"pid": "RF-PAT-003", "name": "Rajesh Kumar", "age": 68, "gender": "Male", "cid": "RF-2026-0003", "region": "Femur", "pred": "Possible Fracture", "prob": 0.93, "qual": 88.0, "status": "ACCEPTABLE", "prio": "HIGH", "rev": "CONFIRMED_FRACTURE"},
                {"pid": "RF-PAT-004", "name": "Sunita Rao", "age": 55, "gender": "Female", "cid": "RF-2026-0004", "region": "Ankle", "pred": "Possible Fracture", "prob": 0.62, "qual": 78.0, "status": "ACCEPTABLE", "prio": "MEDIUM", "rev": "PENDING"},
                {"pid": "RF-PAT-005", "name": "Vikram Singh", "age": 24, "gender": "Male", "cid": "RF-2026-0005", "region": "Ribs", "pred": "Poor Image Quality", "prob": 0.0, "qual": 38.0, "status": "POOR IMAGE QUALITY", "prio": "GRAY", "rev": "NEEDS_RETAKE"}
            ]

            doc_user = db.query(User).filter(User.role == "DOCTOR").first()
            doc_id = doc_user.id if doc_user else "doc1"

            for d in demo_cases_data:
                patient = Patient(
                    patient_id=d["pid"],
                    name=d["name"],
                    age=d["age"],
                    gender=d["gender"],
                    hospital_name="Primary Rural Clinic",
                    department="Radiology"
                )
                db.add(patient)

                orig_file = os.path.join("uploads", "original", f"{d['cid']}.jpg")
                enh_file = os.path.join("uploads", "enhanced", f"{d['cid']}_enhanced.png")
                gcam_file = os.path.join("uploads", "gradcam", f"gradcam_{d['cid']}.jpg")

                # Synthetic X-ray canvas
                img = np.zeros((450, 450), dtype=np.uint8) + 40
                cv2.rectangle(img, (180, 50), (270, 400), (180), -1)
                if "Fracture" in d["pred"]:
                    cv2.line(img, (170, 210), (280, 230), (10), 4)

                cv2.imwrite(orig_file, img)

                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
                enhanced = clahe.apply(img)
                cv2.imwrite(enh_file, enhanced)

                heatmap = cv2.applyColorMap(img, cv2.COLORMAP_JET)
                cv2.imwrite(gcam_file, heatmap)

                case = XRayCase(
                    case_id=d["cid"],
                    patient_id=d["pid"],
                    body_region=d["region"],
                    image_path=orig_file,
                    enhanced_image_path=enh_file,
                    examination_date="2026-09-29",
                    image_quality_score=d["qual"],
                    image_quality_status=d["status"]
                )
                db.add(case)

                ai_pred = AIPrediction(
                    case_id=d["cid"],
                    model_name="EfficientNet-B0",
                    model_version="v1.0",
                    prediction=d["pred"],
                    fracture_probability=d["prob"],
                    confidence=d["prob"] if d["prob"] > 0.5 else (1.0 - d["prob"]),
                    priority=d["prio"],
                    gradcam_path=gcam_file
                )
                db.add(ai_pred)

                rev = ClinicalReview(
                    case_id=d["cid"],
                    reviewer_id=doc_id,
                    review_status=d["rev"],
                    reviewer_notes="Sample clinical baseline review for demonstration."
                )
                db.add(rev)

            db.commit()
            print("[Startup] Initial demo database seeded successfully.")

    finally:
        db.close()


@app.get("/")
def root():
    return {
        "system": "RuralFracture-AI",
        "tagline": "Enhance. Detect. Prioritize.",
        "status": "ONLINE",
        "disclaimer": "AI-assisted screening only. Final interpretation and clinical decision must be made by a qualified healthcare professional."
    }
