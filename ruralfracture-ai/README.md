# RuralFracture-AI

> **TAGLINE:** "Enhance. Detect. Prioritize."

> **IMPORTANT MEDICAL DISCLAIMER:**  
> **AI-assisted screening only. Final interpretation and clinical decision must be made by a qualified healthcare professional.**

---

## 1. Project Overview

**RuralFracture-AI** is an AI-assisted healthcare screening platform designed for rural clinics, regional hospitals, and point-of-care healthcare workers. It enables clinical staff to upload portable X-ray images, evaluate image quality via OpenCV, sharpen subtle trabecular & cortical bone structures using CLAHE (Contrast Limited Adaptive Histogram Equalization), perform deep learning fracture screening via **EfficientNet-B0**, visualize model attention maps with **Grad-CAM (Explainable AI)**, prioritize urgent cases via a 4-tier triage engine, and facilitate professional doctor review sign-offs.

---

## 2. System Architecture & End-to-End Workflow

```
Healthcare Worker / Doctor
        │
        ▼
   React Web App (Vite + Tailwind CSS + Recharts + Lucide)
        │
  ┌─────┴────────────────────────┐
  ▼                              ▼
FastAPI REST API            AI ASSISTANT
 (Python 3.13)              (LLM / Smart Mock)
  │                              │
  ├──────────────┬───────────────┤
  ▼              ▼               ▼
SQLite/Postgres  OpenCV Pipeline PyTorch Model (EfficientNet-B0)
(SQLAlchemy)     (CLAHE/Sharpen) (Grad-CAM XAI)
  │              │               │
  └──────────────┴───────────────┴────────┐
                                         ▼
                                   Triage Engine
                             (HIGH / MED / LOW / GRAY)
                                         │
                                         ▼
                                  Clinical Review
                                         │
                                         ▼
                                  Dashboard Stats
```

---

## 3. Technology Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Recharts, Axios, React Router v7
- **Backend:** Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Passlib / Hashlib, PyJWT
- **Database:** SQLite (default zero-config setup) / PostgreSQL dual-support
- **Machine Learning & Image Processing:** PyTorch 2.14, Torchvision 0.29 (EfficientNet-B0), OpenCV (`cv2`), Grad-CAM XAI, NumPy, SciPy, Scikit-Learn, Pandas, Pillow
- **AI Assistant:** Modular provider system (`MockAIProvider`, `OpenAIProvider`, `LocalLLMProvider`)

---

## 4. Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### Quick Start (Local Development)

#### 1. Backend Setup
```bash
cd ruralfracture-ai/backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

#### 2. Frontend Setup
```bash
cd ruralfracture-ai/frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173/` in your browser.

---

## 5. Environment Variables (.env.example)

```env
# Backend Configuration
DATABASE_URL=sqlite:///./ruralfracture.db
JWT_SECRET_KEY=ruralfracture_secret_key_2026_super_secure

# AI Assistant Configuration
AI_PROVIDER=mock  # Options: 'mock', 'openai', 'local'
AI_MODEL=gpt-4o-mini
AI_API_KEY=
```

---

## 6. Dataset Structure & Import Instructions

Organize dataset archives using the standard structure:

```
dataset/
├── metadata/
│   ├── patients.csv
│   └── cases.csv
├── images/
│   ├── fracture/
│   │   └── RF001.jpg
│   └── no_fracture/
│       └── RF102.jpg
└── annotations/
    └── RF001.txt (Optional YOLO bounding boxes)
```

### Supported Import Formats:
- Manual entry via Patient & Case Web Forms
- Bulk CSV / Excel files
- ZIP archives containing images and metadata

---

## 7. Machine Learning Pipeline: EfficientNet-B0, Transfer Learning & Fine-Tuning

1. **EfficientNet-B0 Architecture:** Selected for its optimal compound scaling coefficient across network depth, width, and input image resolution.
2. **Transfer Learning:** Leverages weights pre-trained on ImageNet to extract low-level edge and texture primitives.
3. **Fine-Tuning:** The linear classification head is replaced with a custom Dropout(0.3) + Linear(2) layer fine-tuned specifically on musculoskeletal X-rays.
4. **Patient-Level Split:** Enforces 70% Train / 15% Validation / 15% Test split grouped by `patient_id` to eliminate data leakage across patient scans.

---

## 8. Grad-CAM Explainable AI (XAI)

Grad-CAM computes gradients flowing from the target fracture class back into the final convolutional layer of EfficientNet-B0 (`features[-1]`). It computes weighted spatial activation maps to highlight image regions influencing the classification.

---

## 9. Triage Priority Engine Rules

- 🔴 **RED / HIGH:** Strong fracture indication (probability $\ge$ 70%) $\rightarrow$ Urgent clinical review
- 🟡 **YELLOW / MEDIUM:** Possible fracture indication (40% $\le$ probability $<$ 70%) $\rightarrow$ Clinical review required
- 🟢 **GREEN / LOW:** No obvious fracture detected (probability $<$ 40%) $\rightarrow$ Standard review
- ⚪ **GRAY:** Poor image quality (quality score $<$ 50%) $\rightarrow$ Re-upload / retake recommended

---

## 10. Medical Safety & Privacy Compliance

- **No Autonomous Diagnosis:** System strictly provides screening indicators.
- **Privacy Separation:** Patient names and identifying metadata are stored separately from machine-learning feature vectors.

---

## 11. License & Copyright

© 2026 RuralFracture-AI Team. All Rights Reserved.
