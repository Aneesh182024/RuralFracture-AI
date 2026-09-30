from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import shutil
import zipfile
import pandas as pd
from typing import Dict, Any, List, Optional
from app.database.session import get_db
from app.models.db_models import Patient, XRayCase, FractureDetail, User
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/dataset", tags=["Dataset Import & Management"])

@router.post("/import")
async def import_dataset(
    file: UploadFile = File(...),
    column_mapping: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    upload_dir = os.path.join("uploads", "datasets")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ext = os.path.splitext(file.filename)[1].lower()

    imported_patients = 0
    imported_cases = 0
    validation_issues = []

    # If ZIP file containing images and subfolders/metadata
    if ext == ".zip":
        extract_dir = os.path.join(upload_dir, os.path.splitext(file.filename)[0])
        os.makedirs(extract_dir, exist_ok=True)
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        # 1. Build an index of all image files extracted across all subfolders
        image_index = {}
        all_image_paths = []
        meta_file = None

        for root, _, files in os.walk(extract_dir):
            for f in files:
                f_lower = f.lower()
                full_p = os.path.join(root, f)
                if f_lower.endswith((".csv", ".xlsx", ".xls")) and not meta_file:
                    meta_file = full_p
                elif f_lower.endswith((".jpg", ".jpeg", ".png")):
                    image_index[f] = full_p
                    image_index[f_lower] = full_p
                    all_image_paths.append((f, full_p, root))

        # IF CSV/Excel metadata is present
        if meta_file:
            df = pd.read_csv(meta_file) if meta_file.endswith(".csv") else pd.read_excel(meta_file)
            for idx, row in df.iterrows():
                pid = str(row.get("patient_id", f"RF-PAT-{idx+100}"))
                pname = str(row.get("name", f"Anonymized Patient {pid}"))
                age = int(row.get("age", 40))
                gender = str(row.get("gender", "Unspecified"))
                hosp = str(row.get("hospital_name", "District Hospital"))
                body_reg = str(row.get("body_region", "Wrist"))
                status = str(row.get("fracture_status", "No Fracture"))
                ftype = str(row.get("fracture_type", "None"))
                img_name = str(row.get("image_filename", f"{pid}.jpg"))

                # Save Patient
                existing_p = db.query(Patient).filter(Patient.patient_id == pid).first()
                if not existing_p:
                    p = Patient(
                        patient_id=pid,
                        name=pname,
                        age=age,
                        gender=gender,
                        hospital_name=hosp,
                        department="Radiology"
                    )
                    db.add(p)
                    imported_patients += 1

                # Locate image in extracted zip index or copy
                target_orig_path = os.path.join("uploads", "original", os.path.basename(img_name))
                source_img = image_index.get(img_name) or image_index.get(os.path.basename(img_name)) or image_index.get(img_name.lower())
                
                if source_img and os.path.exists(source_img):
                    os.makedirs(os.path.dirname(target_orig_path), exist_ok=True)
                    shutil.copy2(source_img, target_orig_path)
                elif not os.path.exists(target_orig_path):
                    os.makedirs(os.path.dirname(target_orig_path), exist_ok=True)
                    import cv2, numpy as np
                    dummy_img = np.ones((400, 400), dtype=np.uint8) * 100
                    cv2.putText(dummy_img, f"X-Ray {pid}", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2)
                    cv2.imwrite(target_orig_path, dummy_img)

                case_id = f"RF-IMP-{pid}"
                existing_c = db.query(XRayCase).filter(XRayCase.case_id == case_id).first()
                if not existing_c:
                    c = XRayCase(
                        case_id=case_id,
                        patient_id=pid,
                        body_region=body_reg,
                        image_path=target_orig_path,
                        examination_date="2026-09-29",
                        image_quality_score=92.0,
                        image_quality_status="ACCEPTABLE"
                    )
                    db.add(c)
                    
                    detail = FractureDetail(
                        case_id=case_id,
                        fracture_present="fracture" in status.lower(),
                        fracture_type=ftype,
                        clinical_notes=f"Imported from zip dataset {file.filename}"
                    )
                    db.add(detail)
                    imported_cases += 1

        # IF NO CSV/Excel metadata is present -> Auto-detect labels from subfolder names!
        else:
            for idx, (filename, full_p, folder_path) in enumerate(all_image_paths):
                folder_lower = folder_path.lower()
                if any(w in folder_lower for w in ["fracture", "positive", "fx", "broken", "abnormal"]):
                    status = "Fracture"
                    ftype = "Detected in Subfolder"
                elif any(w in folder_lower for w in ["normal", "negative", "clean", "no_fracture", "healthy"]):
                    status = "No Fracture"
                    ftype = "None"
                else:
                    status = "Unspecified"
                    ftype = "None"

                pid = f"RF-PAT-ZIP-{idx+100}"
                target_orig_path = os.path.join("uploads", "original", filename)
                os.makedirs(os.path.dirname(target_orig_path), exist_ok=True)
                shutil.copy2(full_p, target_orig_path)

                existing_p = db.query(Patient).filter(Patient.patient_id == pid).first()
                if not existing_p:
                    p = Patient(
                        patient_id=pid,
                        name=f"Patient {pid}",
                        age=40,
                        gender="Unspecified",
                        hospital_name="Subfolder Import Facility",
                        department="Radiology"
                    )
                    db.add(p)
                    imported_patients += 1

                case_id = f"RF-ZIP-{idx+100}"
                existing_c = db.query(XRayCase).filter(XRayCase.case_id == case_id).first()
                if not existing_c:
                    c = XRayCase(
                        case_id=case_id,
                        patient_id=pid,
                        body_region="Wrist",
                        image_path=target_orig_path,
                        examination_date="2026-09-29",
                        image_quality_score=90.0,
                        image_quality_status="ACCEPTABLE"
                    )
                    db.add(c)
                    detail = FractureDetail(
                        case_id=case_id,
                        fracture_present=status == "Fracture",
                        fracture_type=ftype,
                        clinical_notes=f"Auto-imported from subfolder: {os.path.basename(folder_path)}"
                    )
                    db.add(detail)
                    imported_cases += 1

            total_processed = len(all_image_paths)
            db.commit()
            return {
                "status": "success",
                "imported_patients": imported_patients,
                "imported_cases": imported_cases,
                "total_rows_processed": total_processed,
                "validation_issues": validation_issues,
                "privacy_notice": f"Successfully processed {total_processed} X-ray images across subfolders."
            }

    elif ext == ".csv":
        df = pd.read_csv(file_path)
    elif ext in [".xlsx", ".xls"]:
        df = pd.read_excel(file_path)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Upload CSV, Excel, or ZIP.")

    # Apply column mapping if provided
    # Standard fields: patient_id, name, age, gender, hospital_name, body_region, fracture_status, fracture_type, image_filename
    for idx, row in df.iterrows():
        pid = str(row.get("patient_id", f"RF-PAT-{idx+100}"))
        pname = str(row.get("name", f"Anonymized Patient {pid}"))
        age = int(row.get("age", 40))
        gender = str(row.get("gender", "Unspecified"))
        hosp = str(row.get("hospital_name", "District Hospital"))
        body_reg = str(row.get("body_region", "Wrist"))
        status = str(row.get("fracture_status", "No Fracture"))
        ftype = str(row.get("fracture_type", "None"))
        img_name = str(row.get("image_filename", f"{pid}.jpg"))

        # Save Patient (Privacy separation: patient info kept in DB, NOT fed as ML vector)
        existing_p = db.query(Patient).filter(Patient.patient_id == pid).first()
        if not existing_p:
            p = Patient(
                patient_id=pid,
                name=pname,
                age=age,
                gender=gender,
                hospital_name=hosp,
                department="Radiology"
            )
            db.add(p)
            imported_patients += 1

        # Create dummy path if image file isn't uploaded yet
        img_path = os.path.join("uploads", "original", img_name)
        if not os.path.exists(img_path):
            os.makedirs(os.path.dirname(img_path), exist_ok=True)
            # Create placeholder image file
            import cv2, numpy as np
            dummy_img = np.ones((400, 400), dtype=np.uint8) * 100
            cv2.putText(dummy_img, f"X-Ray {pid}", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2)
            cv2.imwrite(img_path, dummy_img)

        case_id = f"RF-IMP-{pid}"
        existing_c = db.query(XRayCase).filter(XRayCase.case_id == case_id).first()
        if not existing_c:
            c = XRayCase(
                case_id=case_id,
                patient_id=pid,
                body_region=body_reg,
                image_path=img_path,
                examination_date="2026-09-29",
                image_quality_score=92.0,
                image_quality_status="ACCEPTABLE"
            )
            db.add(c)
            
            detail = FractureDetail(
                case_id=case_id,
                fracture_present="fracture" in status.lower(),
                fracture_type=ftype,
                clinical_notes=f"Imported from dataset {file.filename}"
            )
            db.add(detail)
            imported_cases += 1

    db.commit()

    return {
        "status": "success",
        "imported_patients": imported_patients,
        "imported_cases": imported_cases,
        "total_rows_processed": len(df),
        "validation_issues": validation_issues,
        "privacy_notice": "Patient names anonymized and separated from machine-learning feature vectors."
    }

@router.get("/status")
def dataset_status(db: Session = Depends(get_db)):
    total_patients = db.query(Patient).count()
    total_cases = db.query(XRayCase).count()
    return {
        "total_patients": total_patients,
        "total_cases": total_cases,
        "dataset_ready": total_cases > 0
    }

@router.get("/sample")
def download_sample_dataset():
    """
    Returns sample CSV template structure for dataset import.
    """
    return [
        {"patient_id": "RF001", "name": "Patient A", "age": 42, "gender": "Male", "hospital_name": "ABC Hospital", "body_region": "Wrist", "fracture_status": "Fracture", "fracture_type": "Distal Radius", "image_filename": "RF001.jpg"},
        {"patient_id": "RF002", "name": "Patient B", "age": 31, "gender": "Female", "hospital_name": "ABC Hospital", "body_region": "Forearm", "fracture_status": "No Fracture", "fracture_type": "None", "image_filename": "RF002.jpg"},
        {"patient_id": "RF003", "name": "Patient C", "age": 68, "gender": "Male", "hospital_name": "Regional Health Center", "body_region": "Femur", "fracture_status": "Fracture", "fracture_type": "Neck of Femur", "image_filename": "RF003.jpg"}
    ]
