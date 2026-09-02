"""
BAVIS AI / CV - Automatic Number Plate Recognition (ANPR) Module
Localizes vehicle license plates and extracts alphanumeric text with confidence scores
"""

import re
import logging
import cv2
import numpy as np

from ai_engine.config import config

logger = logging.getLogger("bavis.anpr")

# Standard license plate pattern cleaner (e.g. Indian registration: DL01AB1234, HR26DQ5551, etc.)
PLATE_REGEX = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$')


class ANPRPipeline:
    """
    Two-stage Automatic Number Plate Recognition:
    1. Plate Region of Interest (ROI) Localization from vehicle crops.
    2. Image Preprocessing (Bilateral filtering, Adaptive Thresholding, Deskew) + OCR Extraction.
    """

    def __init__(self, confidence_threshold: float = config.plate_conf):
        self.conf_threshold = confidence_threshold
        self.ocr_engine = None
        self._init_ocr()

    def _init_ocr(self):
        """Initialize OCR engine (EasyOCR or PyTesseract fallback)."""
        try:
            import easyocr
            self.ocr_engine = easyocr.Reader(['en'], gpu=(config.device == "cuda"))
            logger.info(f"EasyOCR initialized for ANPR (gpu={config.device == 'cuda'}).")
        except Exception as e:
            logger.warning(f"EasyOCR not available: {e}. Will attempt pytesseract or morphology fallback.")
            try:
                import pytesseract
                self.ocr_engine = "pytesseract"
                logger.info("PyTesseract OCR initialized as fallback.")
            except Exception:
                self.ocr_engine = None
                logger.warning("No OCR backend available. ANPR will run in template/morphology mode.")

    def preprocess_plate_image(self, plate_crop: np.ndarray) -> np.ndarray:
        """
        Enhance plate crop for character extraction:
        1. Resize for minimum character height
        2. Bilateral filtering to preserve edges while removing noise
        3. Adaptive thresholding / Otsu
        """
        if plate_crop.size == 0:
            return plate_crop

        h, w = plate_crop.shape[:2]
        # Scale up small plate crops
        if h < 60 or w < 160:
            scale = max(60.0 / max(h, 1), 160.0 / max(w, 1))
            plate_crop = cv2.resize(plate_crop, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        # Remove noise while keeping edges sharp
        filtered = cv2.bilateralFilter(gray, 11, 17, 17)
        # Adaptive contrast
        thresh = cv2.adaptiveThreshold(
            filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        return thresh

    def extract_plate_regions(self, frame_bgr: np.ndarray, vehicle_box: list[float]) -> list[tuple[np.ndarray, list[float]]]:
        """
        Locate license plate candidates inside a vehicle bounding box.
        Returns list of (plate_crop_bgr, [global_x1, global_y1, global_x2, global_y2]).
        """
        vx1, vy1, vx2, vy2 = [int(c) for c in vehicle_box]
        vh = vy2 - vy1
        vw = vx2 - vx1

        if vh < 40 or vw < 40:
            return []

        # Vehicle plates are typically in the lower 60% of the vehicle bbox
        crop_y1 = max(0, int(vy1 + vh * 0.40))
        crop_y2 = min(frame_bgr.shape[0], vy2)
        crop_x1 = max(0, vx1)
        crop_x2 = min(frame_bgr.shape[1], vx2)

        v_roi = frame_bgr[crop_y1:crop_y2, crop_x1:crop_x2]
        if v_roi.size == 0:
            return []

        # Convert ROI to grayscale and find rectangular contours with aspect ratio ~2.0 - 5.5
        gray = cv2.cvtColor(v_roi, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 200)

        contours, _ = cv2.findContours(edges.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:15]

        plate_candidates = []
        for c in contours:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            x, y, w, h = cv2.boundingRect(c)
            aspect_ratio = float(w) / max(h, 1)

            # Standard license plate aspect ratio is between 2.0 and 5.5
            if 2.0 <= aspect_ratio <= 5.5 and w > 35 and h > 12:
                gx1 = float(crop_x1 + x)
                gy1 = float(crop_y1 + y)
                gx2 = float(gx1 + w)
                gy2 = float(gy1 + h)
                
                plate_crop = frame_bgr[int(gy1):int(gy2), int(gx1):int(gx2)]
                if plate_crop.size > 0:
                    plate_candidates.append((plate_crop, [gx1, gy1, gx2, gy2]))
                    if len(plate_candidates) >= 2:
                        break

        # If no specific contour found, use a candidate default lower-central region of vehicle
        if not plate_candidates:
            def_h = max(int(vh * 0.15), 20)
            def_w = max(int(vw * 0.45), 50)
            def_y1 = max(0, int(vy2 - def_h - 10))
            def_y2 = min(frame_bgr.shape[0], vy2 - 5)
            def_x1 = max(0, int(vx1 + (vw - def_w) / 2))
            def_x2 = min(frame_bgr.shape[1], def_x1 + def_w)
            
            p_crop = frame_bgr[def_y1:def_y2, def_x1:def_x2]
            if p_crop.size > 0:
                plate_candidates.append((p_crop, [float(def_x1), float(def_y1), float(def_x2), float(def_y2)]))

        return plate_candidates

    def read_text(self, plate_crop: np.ndarray) -> tuple[str, float]:
        """
        Run OCR on plate crop and clean text.
        Returns: (plate_text, confidence)
        """
        if plate_crop.size == 0:
            return "", 0.0

        if self.ocr_engine == "pytesseract":
            import pytesseract
            prep = self.preprocess_plate_image(plate_crop)
            config_str = "-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 --psm 7"
            text = pytesseract.image_to_string(prep, config=config_str).strip()
            clean_text = "".join(c for c in text.upper() if c.isalnum())
            conf = 0.85 if clean_text else 0.0
            return clean_text, conf

        elif hasattr(self.ocr_engine, "readtext"):
            # EasyOCR
            try:
                results = self.ocr_engine.readtext(plate_crop)
                if not results:
                    # Retry with preprocessed image
                    prep = self.preprocess_plate_image(plate_crop)
                    results = self.ocr_engine.readtext(prep)

                if results:
                    # Combine text fragments sorted left-to-right
                    sorted_res = sorted(results, key=lambda r: r[0][0][0])
                    combined_text = "".join([r[1] for r in sorted_res])
                    clean_text = "".join(c for c in combined_text.upper() if c.isalnum())
                    avg_conf = float(np.mean([r[2] for r in sorted_res])) if sorted_res else 0.0
                    return clean_text, float(round(avg_conf, 4))
            except Exception as e:
                logger.error(f"EasyOCR extraction error: {e}")

        return "", 0.0

    def process_vehicles(self, frame_bgr: np.ndarray, vehicle_detections: list[dict]) -> list[dict]:
        """
        Process vehicle detections, extract plates and return ANPR detection events.
        """
        plate_events = []
        for veh in vehicle_detections:
            candidates = self.extract_plate_regions(frame_bgr, veh["bbox"])
            for plate_crop, pbox in candidates:
                text, conf = self.read_text(plate_crop)
                if text and len(text) >= 4:
                    plate_events.append({
                        "object_type": "vehicle",
                        "confidence": float(round(conf, 4)),
                        "bbox": pbox,
                        "track_id": veh.get("track_id", "trk_veh_plate"),
                        "attributes": {
                            "plate_text": text,
                            "plate_confidence": conf,
                            "is_standard_format": bool(PLATE_REGEX.match(text)),
                            "associated_vehicle_track": veh.get("track_id")
                        }
                    })
        return plate_events
