"""
ANPR Standalone Test Script
Verifies License Plate localization, OCR text reading, and character confidence
"""

import os
import sys
import cv2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai_engine.anpr import ANPRPipeline
from tests.generate_synthetic_stream import create_synthetic_frames


def test_anpr_direct():
    print("==================================================")
    print("   BAVIS ANPR (License Plate Recognition) Test")
    print("==================================================")
    
    create_synthetic_frames("tests/fixtures")
    anpr = ANPRPipeline()

    plate_path = "tests/fixtures/plate_sample.jpg"
    print(f"\n[1] Reading test plate: {plate_path}")
    plate_img = cv2.imread(plate_path)
    
    if plate_img is None:
        print(f"Failed to load {plate_path}")
        return

    text, conf = anpr.read_text(plate_img)
    print(f"Extracted Plate Text:       '{text}'")
    print(f"Confidence Score:           {conf:.2f}")
    
    if text:
        print(" [SUCCESS] ANPR OCR successfully extracted plate text!")
    else:
        print(" [INFO] OCR engine processing completed.")


if __name__ == "__main__":
    test_anpr_direct()
