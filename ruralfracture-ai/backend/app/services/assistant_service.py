import os
import re
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

class BaseAIProvider:
    def generate_response(self, prompt: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> str:
        raise NotImplementedError

class MockAIProvider(BaseAIProvider):
    """
    Built-in intelligent rule-based & DB-querying AI assistant.
    Provides context-aware help, dataset assistance, result explanations,
    natural-language database reporting, and strict medical disclaimers.
    """

    SAFETY_DISCLAIMER = "\n\n⚠️ *AI-assisted screening only. Final interpretation and clinical decision must be made by a qualified healthcare professional.*"

    def generate_response(self, prompt: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> str:
        p_lower = prompt.lower().strip()
        ctx = context or {}

        # 1. Check for Natural Language Database Queries
        if db and any(term in p_lower for term in ["how many", "count", "show", "find", "cases", "high-priority", "high priority", "poor-quality", "poor quality"]):
            db_res = self._handle_db_query(p_lower, db)
            if db_res:
                return db_res + self.SAFETY_DISCLAIMER

        # 2. Case Summarization
        if "summarize" in p_lower or "summary" in p_lower or p_lower == "summarize case":
            if ctx.get("case_id"):
                return (
                    f"📋 **CASE SUMMARY ({ctx.get('case_id')})**\n\n"
                    f"• **Body Region:** {ctx.get('body_region', 'N/A')}\n"
                    f"• **Image Quality:** {ctx.get('image_quality_score', 'N/A')}% — {ctx.get('image_quality_status', 'N/A')}\n"
                    f"• **AI Screening Result:** {ctx.get('prediction', 'N/A')}\n"
                    f"• **Model Confidence:** {int(float(ctx.get('confidence', 0))*100)}%\n"
                    f"• **Priority Level:** {ctx.get('priority', 'N/A')}\n"
                    f"• **Grad-CAM Heatmap:** {'Available' if ctx.get('gradcam_available') else 'Not generated'}\n"
                    f"• **Clinical Review Status:** {ctx.get('review_status', 'Pending Clinical Review')}\n"
                    f"{self.SAFETY_DISCLAIMER}"
                )
            else:
                return f"No active case selected to summarize. Please view a specific case page to see its summary.{self.SAFETY_DISCLAIMER}"

        # 3. Result Explanation
        if "explain result" in p_lower or ("explain" in p_lower and "result" in p_lower):
            pred = ctx.get("prediction", "Possible Fracture")
            conf = int(float(ctx.get("confidence", 0.87)) * 100) if ctx.get("confidence") else 87
            qual = ctx.get("image_quality_score", 91)
            prio = ctx.get("priority", "HIGH")
            return (
                f"🔬 **AI Result Explanation:**\n\n"
                f"The AI model predicts a **{pred}** with **{conf}% model confidence**. "
                f"The X-ray image quality score is rated **{qual}% ({ctx.get('image_quality_status', 'ACCEPTABLE')})**. "
                f"Based on probability and quality metrics, the triage engine assigned a **{prio}** review priority.\n\n"
                f"Grad-CAM visual explanation is available to highlight regions that contributed to the model's feature classification."
                f"{self.SAFETY_DISCLAIMER}"
            )

        # 4. Confidence Explanation
        if "confidence" in p_lower:
            return (
                f"📊 **What Model Confidence Means:**\n\n"
                f"Model confidence describes how strongly the EfficientNet-B0 network supports its predicted output class. "
                f"It is a mathematical measure of feature correlation, **not** a clinical guarantee of fracture presence or absence. "
                f"Always combine confidence scores with professional radiographic examination.{self.SAFETY_DISCLAIMER}"
            )

        # 5. Grad-CAM Explanation
        if "grad-cam" in p_lower or "gradcam" in p_lower or "heatmap" in p_lower:
            return (
                f"🔥 **Understanding Grad-CAM (Gradient-weighted Class Activation Mapping):**\n\n"
                f"Grad-CAM is an Explainable AI (XAI) technique. It calculates gradients flowing into the final convolutional layer of EfficientNet-B0 "
                f"to produce a coarse heatmap.\n\n"
                f"• **Warm Colors (Red/Yellow):** High model attention region.\n"
                f"• **Cool Colors (Blue):** Low model attention region.\n\n"
                f"*Note: Grad-CAM shows where the AI focused its feature extraction; it is not a direct anatomical fracture trace.*{self.SAFETY_DISCLAIMER}"
            )

        # 6. Image Quality Explanation
        if "image quality" in p_lower or "blur" in p_lower or "contrast" in p_lower or "exposure" in p_lower:
            return (
                f"📷 **Image Quality Assessment:**\n\n"
                f"Before running deep learning inference, OpenCV evaluates the X-ray for:\n"
                f"1. **Blur (Laplacian Variance):** Sharpness of trabecular lines.\n"
                f"2. **Contrast (RMS Standard Deviation):** Separation between bone and soft tissue.\n"
                f"3. **Exposure (Histogram balance):** Checks over-exposure / under-exposure.\n"
                f"4. **Noise Level & Resolution:** Detects excessive sensor noise or low pixel density.\n\n"
                f"If score is under 50%, the image status becomes **POOR IMAGE QUALITY** and AI screening is paused until a clearer image is provided.{self.SAFETY_DISCLAIMER}"
            )

        # 7. Dataset Help
        if "dataset" in p_lower or "csv" in p_lower or "import" in p_lower:
            return (
                f"📁 **Dataset Import Guidance:**\n\n"
                f"You can import datasets via CSV, Excel, or ZIP files.\n\n"
                f"**Required Mapping Fields:**\n"
                f"• `patient_id` (e.g. RF001)\n"
                f"• `name` (e.g. Patient A)\n"
                f"• `age` & `gender`\n"
                f"• `hospital_name` & `body_region`\n"
                f"• `fracture_status` (Fracture / No Fracture)\n"
                f"• `image_filename` (e.g. RF001.jpg)\n\n"
                f"🔒 **Privacy Notice:** Patient names are stored securely for clinical records but stripped from machine learning feature vectors.{self.SAFETY_DISCLAIMER}"
            )

        # 8. EfficientNet / Model Explanation
        if "efficientnet" in p_lower or "model" in p_lower or "architecture" in p_lower:
            return (
                f"🧠 **Model Architecture (EfficientNet-B0):**\n\n"
                f"RuralFracture-AI uses **EfficientNet-B0**, a convolutional neural network architecture optimized via compound scaling (depth, width, resolution).\n\n"
                f"• **Transfer Learning:** Pre-trained on ImageNet features to recognize edge and contour patterns.\n"
                f"• **Fine-Tuning:** Custom classification head fine-tuned on musculoskeletal X-ray datasets for 2-class (Fracture / No Fracture) triage.{self.SAFETY_DISCLAIMER}"
            )

        # 9. Application Navigation Help
        if "upload" in p_lower or "how do i upload" in p_lower:
            return f"To upload an X-ray: Go to **New Case** in the sidebar → Fill patient details → Drag & drop the X-ray JPG/PNG → Click **Assess Quality & Screen**.{self.SAFETY_DISCLAIMER}"

        if "previous cases" in p_lower or "history" in p_lower:
            return f"To view case history: Click **Patient List** or **Cases** in the sidebar. You can filter by hospital, priority, or search by Patient ID.{self.SAFETY_DISCLAIMER}"

        # General Default Response
        return (
            f"Hello! I am your RuralFracture-AI Assistant.\n\n"
            f"I can help you navigate the system, explain AI predictions, interpret Grad-CAM heatmaps, explain image quality metrics, or query case statistics.\n\n"
            f"Try asking:\n"
            f"• *\"Explain this result\"*\n"
            f"• *\"What is Grad-CAM?\"*\n"
            f"• *\"How many high-priority cases are there?\"*\n"
            f"• *\"How do I import a dataset?\"*{self.SAFETY_DISCLAIMER}"
        )

    def _handle_db_query(self, prompt: str, db: Session) -> Optional[str]:
        from app.models.db_models import XRayCase, AIPrediction, Patient
        try:
            total_cases = db.query(XRayCase).count()
            high_priority = db.query(AIPrediction).filter(AIPrediction.priority == "HIGH").count()
            medium_priority = db.query(AIPrediction).filter(AIPrediction.priority == "MEDIUM").count()
            low_priority = db.query(AIPrediction).filter(AIPrediction.priority == "LOW").count()
            possible_fractures = db.query(AIPrediction).filter(AIPrediction.prediction.like("%Fracture%")).count()
            poor_quality = db.query(XRayCase).filter(XRayCase.image_quality_status == "POOR IMAGE QUALITY").count()

            if "high" in prompt and "priority" in prompt:
                return f"📊 **Database Query:** There are currently **{high_priority} high-priority** cases requiring urgent clinical review out of {total_cases} total registered cases."

            if "poor" in prompt and "quality" in prompt:
                return f"📊 **Database Query:** There are currently **{poor_quality} poor-quality** X-ray images flagged for re-upload."

            if "possible fracture" in prompt or ("fracture" in prompt and "how many" in prompt):
                return f"📊 **Database Query:** The AI screening system has flagged **{possible_fractures} cases** as Possible Fracture."

            if "how many" in prompt or "count" in prompt:
                return (
                    f"📊 **System Statistics Overview:**\n\n"
                    f"• **Total Cases Screened:** {total_cases}\n"
                    f"• **Possible Fractures:** {possible_fractures}\n"
                    f"• **High Priority Cases:** {high_priority}\n"
                    f"• **Medium Priority Cases:** {medium_priority}\n"
                    f"• **Low Priority Cases:** {low_priority}\n"
                    f"• **Poor Image Quality:** {poor_quality}"
                )
        except Exception as e:
            print(f"[DB Query Assistant Error] {e}")
        return None


class OpenAIProvider(BaseAIProvider):
    def __init__(self):
        self.api_key = os.getenv("AI_API_KEY")
        self.model = os.getenv("AI_MODEL", "gpt-4o-mini")

    def generate_response(self, prompt: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> str:
        if not self.api_key:
            # Fallback to Mock provider if API key not supplied
            return MockAIProvider().generate_response(prompt, context, db)
        try:
            import openai
            client = openai.OpenAI(api_key=self.api_key)
            system_instruction = (
                "You are RuralFracture-AI Assistant, a supportive application bot for healthcare workers. "
                "CRITICAL SAFETY RULE: You MUST NEVER diagnose patients, prescribe medication, or claim 100% diagnostic certainty. "
                "Always state that AI predictions are decision-support screening results that require professional clinical review. "
                "Append disclaimer: 'AI-assisted screening only. Final interpretation and clinical decision must be made by a qualified healthcare professional.'"
            )
            context_str = f"Current Case Context: {context}" if context else ""
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": f"{context_str}\n\nUser Question: {prompt}"}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[OpenAI Provider Error] {e}. Falling back to mock assistant.")
            return MockAIProvider().generate_response(prompt, context, db)


def get_ai_assistant_provider() -> BaseAIProvider:
    provider_name = os.getenv("AI_PROVIDER", "mock").lower()
    if provider_name == "openai":
        return OpenAIProvider()
    return MockAIProvider()
