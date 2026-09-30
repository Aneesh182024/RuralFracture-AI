import cv2
import numpy as np
import os
from PIL import Image
from typing import Dict, Any, Tuple

class ImageProcessor:
    """
    OpenCV-based Image Quality Assessment and Image Enhancement Pipeline
    for RuralFracture-AI.
    """

    @staticmethod
    def assess_quality(image_path: str) -> Dict[str, Any]:
        """
        Assess X-ray image quality checking blur, noise, contrast, exposure, and resolution.
        Returns quality score (0-100), status, breakdown, and recommendation.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")

        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {
                "score": 0.0,
                "status": "POOR IMAGE QUALITY",
                "blur_score": 0.0,
                "contrast_score": 0.0,
                "exposure_score": 0.0,
                "noise_score": 0.0,
                "recommendation": "Unable to decode image file. Please upload a valid JPG/PNG X-ray."
            }

        height, width = img.shape

        # 1. Blur Assessment (Laplacian Variance)
        laplacian_var = cv2.Laplacian(img, cv2.CV_64F).var()
        # Scale variance to score: threshold around 100 for acceptable sharpness
        blur_score = min(100.0, (laplacian_var / 150.0) * 100.0)

        # 2. Contrast Assessment (RMS Contrast / Standard Deviation)
        contrast_std = np.std(img)
        # Healthy X-rays usually have std dev between 30 and 70
        contrast_score = min(100.0, (contrast_std / 50.0) * 100.0)

        # 3. Exposure Assessment (Mean intensity and histogram balance)
        mean_intensity = np.mean(img)
        # Good X-ray exposure: mean between 60 and 190
        if 60 <= mean_intensity <= 190:
            exposure_score = 100.0 - abs(mean_intensity - 125) * 0.5
        elif mean_intensity < 60:
            exposure_score = max(10.0, (mean_intensity / 60.0) * 80.0)
        else:
            exposure_score = max(10.0, ((255 - mean_intensity) / 65.0) * 80.0)

        # 4. Noise Assessment (High frequency std dev estimate)
        blur_diff = cv2.absdiff(img, cv2.GaussianBlur(img, (5, 5), 0))
        noise_level = np.mean(blur_diff)
        noise_score = max(10.0, 100.0 - (noise_level * 5.0))

        # 5. Resolution Assessment
        min_dim = min(height, width)
        res_score = 100.0 if min_dim >= 500 else (min_dim / 500.0) * 100.0

        # Overall composite weighted score
        composite_score = (
            blur_score * 0.35 +
            contrast_score * 0.25 +
            exposure_score * 0.20 +
            noise_score * 0.10 +
            res_score * 0.10
        )
        composite_score = round(float(np.clip(composite_score, 0.0, 100.0)), 1)

        status = "ACCEPTABLE" if composite_score >= 50.0 else "POOR IMAGE QUALITY"

        if composite_score < 50.0:
            if blur_score < 40:
                recommendation = "Image is excessively blurry. Please capture a still X-ray before screening."
            elif contrast_score < 40:
                recommendation = "Low contrast detected. Please adjust X-ray exposure settings."
            elif exposure_score < 40:
                recommendation = "X-ray is overexposed or underexposed. Please retake image."
            else:
                recommendation = "Overall image quality is too poor for reliable AI screening. Please upload a clearer X-ray."
        else:
            recommendation = "Image quality is acceptable for AI fracture screening."

        return {
            "score": composite_score,
            "status": status,
            "blur_score": round(float(blur_score), 1),
            "contrast_score": round(float(contrast_score), 1),
            "exposure_score": round(float(exposure_score), 1),
            "noise_score": round(float(noise_score), 1),
            "recommendation": recommendation
        }

    @staticmethod
    def enhance_xray(input_path: str, output_path: str) -> str:
        """
        OpenCV Image Enhancement Pipeline:
        Raw X-ray -> Grayscale/Normalization -> Noise Reduction (Bilateral) ->
        CLAHE -> Unsharp Masking / Contrast & Detail Enhancement -> Resized Output.
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")

        img = cv2.imread(input_path)
        if img is None:
            raise ValueError(f"Unable to read image at {input_path}")

        # 1. Convert to grayscale if color
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img.copy()

        # 2. Denoise with Bilateral Filtering (preserves edges while smoothing noise)
        denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

        # 3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced_clahe = clahe.apply(denoised)

        # 4. Unsharp Masking for fine trabecular & cortical bone detail sharpening
        gaussian_blur = cv2.GaussianBlur(enhanced_clahe, (0, 0), 3)
        sharpened = cv2.addWeighted(enhanced_clahe, 1.5, gaussian_blur, -0.5, 0)

        # 5. Normalization (min-max scaling to full 0-255 range)
        normalized = cv2.normalize(sharpened, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)

        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, normalized)

        return output_path
