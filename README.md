# 🩻 RuralFracture-AI

### **Enhance. Detect. Prioritize.**

**AI-Assisted Radiographic Fracture Screening & Clinical Triage for Rural and Underserved Healthcare**

---

## 📌 1. Executive Summary

**RuralFracture-AI** is a clinical decision-support web application designed to help bridge the diagnostic gap in rural and resource-constrained healthcare centers.

In many primary healthcare clinics, radiologists or specialist physicians may not be available on-site, resulting in delays in X-ray interpretation and clinical decision-making.

RuralFracture-AI provides an automated **4-step screening workflow**:

1. 🔍 **Automated Quality Assessment**
   Detects severely blurred or degraded X-rays before AI evaluation.

2. 🖼️ **OpenCV Image Enhancement**
   Enhances bone cortex contrast using adaptive histogram equalization.

3. 🤖 **Deep Learning Screening**
   Uses an optimized **EfficientNet-B0** model to estimate fracture likelihood.

4. 🧠 **Grad-CAM Explainability & Triage**
   Generates visual heatmaps highlighting regions that influenced the model and assigns cases to **HIGH**, **MEDIUM**, or **LOW** priority for remote review.

> **Important:** RuralFracture-AI is intended as a clinical decision-support and screening system. It does not replace professional radiological diagnosis.

---

# 📊 2. Dataset — FracAtlas

RuralFracture-AI uses the **FracAtlas Dataset**, an expert-annotated clinical X-ray dataset.

### Dataset Location

```text
backend/uploads/datasets/FracAtlas/
```

### Dataset Statistics

| Category                 |       Images |
| ------------------------ | -----------: |
| 🦴 Fractured Cases       |      **717** |
| ✅ Non-Fractured Cases    |    **3,366** |
| 📊 Total Images          |    **4,083** |
| ⚖️ Class Imbalance Ratio | **1 : 4.69** |

The positive fracture class is weighted during training to compensate for class imbalance.

### Image Format

* Grayscale radiographic JPEG images
* Resized to **224 × 224**
* Converted to **3-channel RGB tensors** for EfficientNet-B0

---

## 📂 Official Dataset Partition

To reduce the possibility of data leakage, the model follows the official FracAtlas partitioning.

| Split          | Fractured | Non-Fractured |     Total | Percentage |
| -------------- | --------: | ------------: | --------: | ---------: |
| **Training**   |       574 |         2,692 | **3,266** |        80% |
| **Validation** |        82 |           337 |   **419** |        10% |
| **Test**       |        61 |           337 |   **398** |        10% |
| **Total**      |   **717** |     **3,366** | **4,083** |   **100%** |

> The test set remains **untouched during training** and is used only for final model evaluation.

---

# 🧠 3. Deep Learning Architecture

## EfficientNet-B0

The primary fracture classifier is based on **EfficientNet-B0** using transfer learning.

### Architecture

```text
Image
  │
  ▼
Resize 224 × 224
  │
  ▼
ImageNet Normalization
  │
  ▼
EfficientNet-B0
  │
  ├── Pretrained ImageNet Features
  │
  └── Custom Classification Head
          │
          ├── Dropout (p = 0.3)
          │
          └── Linear Layer
                 │
                 ├── No Fracture
                 └── Possible Fracture
```

### Model Configuration

| Parameter         | Configuration         |
| ----------------- | --------------------- |
| Architecture      | EfficientNet-B0       |
| Transfer Learning | ImageNet Pretrained   |
| Input Size        | 224 × 224 × 3         |
| Dropout           | 0.3                   |
| Output Classes    | 2                     |
| Framework         | PyTorch + Torchvision |

### ImageNet Normalization

```text
Mean = [0.485, 0.456, 0.406]

Std  = [0.229, 0.224, 0.225]
```

---

# 🔄 4. Data Augmentation

Data augmentation is applied **only to the training set**.

The training pipeline includes:

* Random Horizontal Flip
* Random Rotation up to ±10°
* Color Jitter
* Image resizing to 224 × 224
* ImageNet normalization

Validation and test images are not augmented with random transformations.

---

# ⚖️ 5. Class Balancing

The dataset contains significantly more non-fractured images than fractured images.

```text
Fractured Training Images     = 574
Non-Fractured Training Images = 2692
```

The positive class weight is calculated as:

```text
Positive Class Weight
= Non-Fracture Training Count / Fractured Training Count

= 2692 / 574

= 4.690
```

This weighting helps the model give greater importance to the minority fracture class during training.

---

# 🎯 6. Training Configuration

| Parameter                | Value       |
| ------------------------ | ----------- |
| Framework                | PyTorch     |
| Optimizer                | Adam        |
| Learning Rate            | 0.0003      |
| Batch Size               | 64          |
| Epochs                   | 5           |
| Positive Class Weight    | 4.690       |
| Best Validation Accuracy | **85.20%**  |
| Best Epoch               | **Epoch 5** |

---

# 🖼️ 7. OpenCV Image Enhancement

Before AI inference, the uploaded X-ray passes through an image enhancement pipeline.

### Enhancement Pipeline

```text
Raw X-Ray
    │
    ▼
Grayscale Conversion
    │
    ▼
CLAHE
    │
    ▼
Unsharp Masking
    │
    ▼
Enhanced X-Ray
    │
    ▼
EfficientNet-B0
```

### Step 1 — Grayscale Conversion

The input X-ray is converted into a single-channel intensity representation.

### Step 2 — CLAHE

**Contrast Limited Adaptive Histogram Equalization (CLAHE)** is used to improve local contrast.

Configuration:

```text
Clip Limit = 3.0
Tile Grid Size = 8 × 8
```

This can help make subtle bone structures and intensity differences more visible.

### Step 3 — Unsharp Masking

An unsharp masking operation is applied to emphasize high-frequency structures and improve visual sharpness.

---

# 🧠 8. Grad-CAM Explainability

RuralFracture-AI uses **Grad-CAM (Gradient-weighted Class Activation Mapping)** to provide visual explanations for the model's prediction.

### Target Layer

```text
model.features[-1]
```

The system calculates gradients of the target fracture logit with respect to the final convolutional feature maps.

The resulting activation map is converted into a heatmap and overlaid on the enhanced X-ray.

### Visualization

```text
Enhanced X-Ray
      │
      ▼
EfficientNet-B0
      │
      ▼
Target Fracture Logit
      │
      ▼
Gradient Calculation
      │
      ▼
Grad-CAM Heatmap
      │
      ▼
Clinical Visualization
```

### Overlay Configuration

```text
X-Ray Contribution   = 65%
Heatmap Contribution = 35%
Colormap              = JET
```

The resulting visualization highlights image regions that contributed to the model's prediction.

> Grad-CAM is an explainability aid and should not be interpreted as a definitive anatomical diagnosis.

---

# 📈 9. Model Evaluation

The final model was evaluated on the independent **FracAtlas test set containing 398 images**.

## Performance Metrics

| Metric                   |      Score |
| ------------------------ | ---------: |
| **Accuracy**             | **84.92%** |
| **Specificity**          | **91.69%** |
| **ROC-AUC**              | **0.8181** |
| **Precision**            | **50.88%** |
| **Sensitivity / Recall** | **47.54%** |
| **F1-Score**             | **0.4915** |

### Metric Definitions

**Accuracy**
Measures the overall proportion of correctly classified X-rays.

**Specificity**
Measures the proportion of non-fractured cases correctly identified as non-fractured.

**ROC-AUC**
Measures the model's ability to distinguish between fractured and non-fractured cases across classification thresholds.

**Precision**
Measures the proportion of predicted fracture cases that are actually fractured.

**Sensitivity / Recall**
Measures the proportion of actual fracture cases detected by the model.

**F1-Score**
Provides a harmonic balance between precision and recall.

---

# 📊 10. Confusion Matrix

The model produced the following results on the 398-image test set:

|                         | Predicted Non-Fracture | Predicted Fracture |
| ----------------------- | ---------------------: | -----------------: |
| **Actual Non-Fracture** |           **309 (TN)** |        **28 (FP)** |
| **Actual Fracture**     |            **32 (FN)** |        **29 (TP)** |

Where:

```text
TN = True Negative
FP = False Positive
FN = False Negative
TP = True Positive
```

---

# 🏥 11. Clinical Triage Workflow

The system provides automated prioritization based on the screening result.

```text
                 X-Ray Upload
                      │
                      ▼
             Quality Assessment
                      │
             ┌────────┴────────┐
             │                 │
          Accept              Reject
             │                 │
             ▼                 ▼
      Image Enhancement     Quality Error
             │
             ▼
       EfficientNet-B0
             │
             ▼
       Fracture Probability
             │
             ▼
         Grad-CAM
             │
             ▼
      Triage Classification
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
     HIGH  MEDIUM  LOW
       │     │     │
       └─────┼─────┘
             ▼
     Remote Specialist Review
```

The triage system categorizes cases into:

* 🔴 **HIGH**
* 🟠 **MEDIUM**
* 🟢 **LOW**

These categories are intended to support prioritization for further clinical review rather than replace professional diagnosis.

---

# 🏗️ 12. System Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                     │
│                       React + Vite                                   │
│                                                                      │
│  • Patient Selection                                                 │
│  • X-Ray Upload Interface                                            │
│  • Real-Time Workflow Stepper                                        │
│  • Upload → Quality → CLAHE → AI → Result                            │
│  • Raw vs Enhanced Image Viewer                                      │
│  • Grad-CAM Heatmap Viewer                                           │
│  • Clinical Triage Dashboard                                         │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ REST API
                               │ JSON / FormData
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         BACKEND                                      │
│                       FastAPI / Python                                │
│                                                                      │
│  • X-Ray Quality Assessment                                          │
│  • Blur Detection                                                    │
│  • Contrast Assessment                                               │
│  • Exposure Assessment                                               │
│  • OpenCV CLAHE Enhancement                                          │
│  • PyTorch Inference                                                 │
│  • EfficientNet-B0                                                   │
│  • Grad-CAM Generation                                                │
│  • Automatic Triage Engine                                           │
│  • SQLite Database                                                   │
│  • File Storage                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         STORAGE                                      │
│                                                                      │
│  • Original X-Rays                                                   │
│  • Enhanced X-Rays                                                   │
│  • Grad-CAM Outputs                                                  │
│  • Patient / Case Metadata                                           │
│  • Prediction Results                                                │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 🛠️ 13. Technology Stack

## Artificial Intelligence & Machine Learning

* **PyTorch**
* **Torchvision**
* **EfficientNet-B0**
* **Grad-CAM**
* **Scikit-learn**

## Computer Vision

* **OpenCV**
* **Pillow (PIL)**

## Backend

* **FastAPI**
* **Uvicorn**
* **SQLAlchemy**
* **SQLite**

## Frontend

* **React**
* **Vite**
* **TailwindCSS**
* **Lucide Icons**
* **Axios**

## Data Processing

* **Pandas**
* **NumPy**

---

# 📁 14. Project Structure

```text
RuralFracture-AI/
│
├── backend/
│   ├── uploads/
│   │   └── datasets/
│   │       └── FracAtlas/
│   │
│   ├── models/
│   ├── services/
│   ├── database/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore
```

> The exact directory structure may vary depending on the implementation.

---

# 🔬 15. End-to-End Workflow

```text
1. Upload X-Ray
       ↓
2. Quality Assessment
       ↓
3. Reject Severely Degraded Images
       ↓
4. OpenCV Enhancement
       ↓
5. CLAHE + Unsharp Masking
       ↓
6. Image Preprocessing
       ↓
7. EfficientNet-B0 Inference
       ↓
8. Fracture Probability
       ↓
9. Grad-CAM Generation
       ↓
10. Triage Priority Assignment
       ↓
11. Display Results
       ↓
12. Remote Clinical Review
```

---

# 🎯 16. Project Objectives

RuralFracture-AI aims to:

* Improve access to AI-assisted X-ray screening in underserved healthcare environments.
* Provide rapid preliminary fracture screening.
* Improve X-ray visibility through automated image enhancement.
* Provide interpretable visual explanations using Grad-CAM.
* Help prioritize cases for remote specialist review.
* Reduce delays caused by limited access to radiological expertise.
* Maintain a clear separation between automated screening and professional diagnosis.

---

# ⚠️ 17. Clinical Safety & Limitations

RuralFracture-AI is an **AI-assisted screening and clinical decision-support system**.

It should **not** be used as a standalone diagnostic system.

The model has limitations, including:

* The model is trained on the FracAtlas dataset.
* Performance may vary on X-rays from different hospitals, devices, populations, and acquisition protocols.
* False positives and false negatives can occur.
* Grad-CAM visualizations indicate model attention and are not guaranteed to represent actual fracture boundaries.
* The reported test metrics are specific to the stated test partition.
* Clinical decisions should remain under the responsibility of qualified healthcare professionals.

---

# 📊 18. Key Results

| Component                | Result                      |
| ------------------------ | --------------------------- |
| Dataset                  | FracAtlas                   |
| Total Images             | **4,083**                   |
| Fractured                | **717**                     |
| Non-Fractured            | **3,366**                   |
| Model                    | **EfficientNet-B0**         |
| Framework                | **PyTorch**                 |
| Best Validation Accuracy | **85.20%**                  |
| Test Accuracy            | **84.92%**                  |
| Specificity              | **91.69%**                  |
| ROC-AUC                  | **0.8181**                  |
| Precision                | **50.88%**                  |
| Recall                   | **47.54%**                  |
| F1-Score                 | **0.4915**                  |
| Explainability           | **Grad-CAM**                |
| Enhancement              | **CLAHE + Unsharp Masking** |
| Backend                  | **FastAPI**                 |
| Frontend                 | **React + Vite**            |
| Database                 | **SQLite**                  |

---

# 🚀 19. Future Enhancements

Potential future improvements include:

* Larger and more diverse multi-center datasets.
* Additional fracture types and anatomical regions.
* Model calibration and threshold optimization.
* External validation on independent hospital datasets.
* Advanced quality-control models.
* DICOM support.
* PACS integration.
* Secure cloud deployment.
* Multilingual healthcare-worker interface.
* Continuous monitoring of model performance.
* Human-in-the-loop radiologist feedback.
* More extensive clinical validation.

---

# 👥 20. Project Team

**RuralFracture-AI** is developed as an AI-assisted healthcare technology project focused on improving preliminary radiographic screening accessibility in rural and underserved healthcare environments.

---

# 📜 21. Disclaimer

> **RuralFracture-AI is a research and clinical decision-support project. It is not a replacement for a qualified radiologist or medical professional. AI-generated predictions and visualizations should be reviewed by an appropriately qualified healthcare professional before clinical decisions are made.**

---

## 🩻 RuralFracture-AI

### **Enhance. Detect. Prioritize.**

**AI-Assisted Radiographic Fracture Screening for Rural & Underserved Healthcare**
