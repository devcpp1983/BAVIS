"""
BAVIS AI / CV - Quick Interactive Test Script
Runs an end-to-end test on sample surveillance frames and prints the contract output.
"""

import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import cv2
from ai_engine.pipeline import VideoIntelligencePipeline
from tests.generate_synthetic_stream import create_synthetic_frames


def main():
    print("=" * 60)
    print("   BAVIS AI Engine - End-to-End System Test")
    print("=" * 60)

    # 1. Ensure test images are generated
    print("\n[1/4] Preparing test fixtures...")
    create_synthetic_frames("tests/fixtures")

    # 2. Initialize pipeline
    print("\n[2/4] Initializing Video Intelligence Pipeline (YOLO + ByteTrack + Night Mode)...")
    pipeline = VideoIntelligencePipeline()

    # 3. Test Daytime Frame
    print("\n[3/4] Testing Daytime Border Surveillance Frame...")
    day_img = cv2.imread("tests/fixtures/day_surveillance.jpg")
    day_resp = pipeline.process_frame(
        frame_bgr=day_img,
        camera_id="cam_bop_north_01",
        enable_face=True,
        enable_anpr=True
    )

    print(f" -> Frame processed in {day_resp.inference_ms:.2f} ms ({day_resp.fps:.1f} FPS)")
    print(f" -> Low-Light Mode: {'ACTIVE' if day_resp.low_light_enhanced else 'DAY'}")
    print(f" -> Detections Found: {day_resp.total_detections}")

    # 4. Test Night-time Frame
    print("\n[4/4] Testing Low-Light Night Surveillance Frame...")
    night_img = cv2.imread("tests/fixtures/night_surveillance.jpg")
    night_resp = pipeline.process_frame(
        frame_bgr=night_img,
        camera_id="cam_bop_river_02",
        enable_face=True,
        enable_anpr=True
    )

    print(f" -> Frame processed in {night_resp.inference_ms:.2f} ms ({night_resp.fps:.1f} FPS)")
    print(f" -> Low-Light Mode: {'ACTIVE' if night_resp.low_light_enhanced else 'DAY'}")
    print(f" -> Detections Found: {night_resp.total_detections}")

    # 5. Print Sample JSON Contract Output
    print("\n" + "=" * 60)
    print("   Sample Detection Contract Output (Section 8.1 Format):")
    print("=" * 60)
    print(json.dumps(day_resp.model_dump(), indent=2))

    print("\n[SUCCESS] Engine test completed successfully!")
    print("Check 'tests/test_pipeline.py' for full test suite or run 'python demo_visualizer.py' for visual overlays.")


if __name__ == "__main__":
    main()
