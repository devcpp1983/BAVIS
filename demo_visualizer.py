"""
BAVIS AI / CV - Visual Demo & Test Tool
Runs the complete BAVIS CV pipeline on test images, video files, or live webcam.
Draws bounding boxes, persistent track IDs, face markers, and ANPR plate readings.
"""

import os
import sys
import argparse
import time
import cv2
import numpy as np

# Ensure root directory is on path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from ai_engine.pipeline import VideoIntelligencePipeline
from tests.generate_synthetic_stream import create_synthetic_frames


def draw_hud_surveillance(frame: np.ndarray, response, latency_ms: float) -> np.ndarray:
    """Draw professional surveillance HUD overlays with bounding boxes and tracking IDs."""
    annotated = frame.copy()
    h, w = annotated.shape[:2]

    COLOR_PERSON = (255, 100, 0)      # Vivid Blue/Cyan
    COLOR_VEHICLE = (0, 200, 255)     # Amber/Yellow
    COLOR_FACE = (0, 255, 120)        # Neon Green
    COLOR_PLATE = (200, 50, 255)      # Magenta

    for det in response.detections:
        x1, y1, x2, y2 = [int(c) for c in det.bbox]
        obj_type = det.object_type
        conf = det.confidence
        track_id = det.track_id

        if obj_type == "person":
            color = COLOR_PERSON
            label = f"{track_id} | PERSON {int(conf * 100)}%"
        elif obj_type == "face":
            color = COLOR_FACE
            label = f"FACE {int(conf * 100)}%"
        elif obj_type == "vehicle":
            plate_text = det.attributes.get("plate_text") if det.attributes else None
            if plate_text:
                color = COLOR_PLATE
                label = f"PLATE: {plate_text} ({int(conf*100)}%)"
            else:
                color = COLOR_VEHICLE
                sub = det.attributes.get("sub_class", "VEHICLE") if det.attributes else "VEHICLE"
                label = f"{track_id} | {sub.upper()} {int(conf * 100)}%"
        else:
            color = (255, 255, 255)
            label = f"{obj_type} {int(conf * 100)}%"

        thickness = 2
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, thickness)
        
        # Corner accent lines
        corner_len = min(15, max((x2 - x1) // 4, 1), max((y2 - y1) // 4, 1))
        if corner_len > 3:
            cv2.line(annotated, (x1, y1), (x1 + corner_len, y1), color, 4)
            cv2.line(annotated, (x1, y1), (x1, y1 + corner_len), color, 4)
            cv2.line(annotated, (x2, y2), (x2 - corner_len, y2), color, 4)
            cv2.line(annotated, (x2, y2), (x2, y2 - corner_len), color, 4)

        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.rectangle(annotated, (x1, max(0, y1 - th - 8)), (x1 + tw + 8, y1), color, -1)
        cv2.putText(annotated, label, (x1 + 4, max(th, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

    # Top-Left Surveillance Info Overlay
    cv2.rectangle(annotated, (10, 10), (330, 95), (20, 20, 20), -1)
    cv2.rectangle(annotated, (10, 10), (330, 95), (0, 255, 200), 1)
    
    cv2.putText(annotated, "BAVIS BORDER AI SURVEILLANCE", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 200), 1, cv2.LINE_AA)
    cv2.putText(annotated, f"CAMERA: {response.camera_id}", (20, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
    cv2.putText(annotated, f"DETECTIONS: {len(response.detections)} | LATENCY: {latency_ms:.1f}ms", (20, 66), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
    
    night_status = "NIGHT ENHANCE: ON" if response.low_light_enhanced else "DAY MODE"
    cv2.putText(annotated, f"STATUS: LIVE | {night_status}", (20, 84), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 100) if response.low_light_enhanced else (100, 200, 255), 1)

    return annotated


def run_video_stream(source: str | int, camera_id: str = "cam_border_01"):
    """Run real-time inference on a video file or webcam stream."""
    pipeline = VideoIntelligencePipeline()
    cap = cv2.VideoCapture(int(source) if str(source).isdigit() else source)

    if not cap.isOpened():
        print(f"Error: Unable to open video source '{source}'")
        return

    print(f"\n[INFO] Starting BAVIS Video Analytics on source: {source} (Press 'q' in video window to exit)...")
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        t0 = time.perf_counter()
        response = pipeline.process_frame(
            frame_bgr=frame,
            camera_id=camera_id,
            enable_face=True,
            enable_anpr=True
        )
        t1 = time.perf_counter()
        lat_ms = (t1 - t0) * 1000

        annotated = draw_hud_surveillance(frame, response, lat_ms)
        cv2.imshow("BAVIS - Border AI Video Intelligence Monitor", annotated)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"[INFO] Finished stream. Processed {frame_count} frames.")


def run_default_fixtures():
    """Run default test fixtures and output annotated surveillance frames."""
    print("==========================================================")
    print("   BAVIS AI Engine - Visual Verification & Test Suite")
    print("==========================================================")
    
    create_synthetic_frames("tests/fixtures")
    pipeline = VideoIntelligencePipeline()

    test_scenarios = [
        ("tests/fixtures/day_surveillance.jpg", "cam_bop_north_01", "Daytime Border Patrol Feed"),
        ("tests/fixtures/night_surveillance.jpg", "cam_bop_river_02", "Low-Light Night Border Feed")
    ]

    os.makedirs("demo_outputs", exist_ok=True)

    for img_path, cam_id, description in test_scenarios:
        print(f"\n--- Testing Scenario: {description} ({img_path}) ---")
        frame = cv2.imread(img_path)
        if frame is None:
            print(f"Error loading {img_path}")
            continue

        t0 = time.perf_counter()
        response = pipeline.process_frame(
            frame_bgr=frame,
            camera_id=cam_id,
            enable_face=True,
            enable_anpr=True
        )
        t1 = time.perf_counter()
        lat_ms = (t1 - t0) * 1000

        print(f"Processed in: {lat_ms:.2f} ms ({response.fps:.1f} FPS)")
        print(f"Low-Light Enhanced: {response.low_light_enhanced}")
        print(f"Total Detections: {len(response.detections)}")

        rendered = draw_hud_surveillance(frame, response, lat_ms)
        out_name = os.path.basename(img_path).replace(".jpg", "_annotated.jpg")
        out_path = os.path.join("demo_outputs", out_name)
        cv2.imwrite(out_path, rendered)
        print(f"Saved visual annotated surveillance image -> {out_path}")

    print("\n==========================================================")
    print("Visual verification complete! Check the 'demo_outputs/' folder.")
    print("==========================================================")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BAVIS Visual Demo & Test Tool")
    parser.add_argument("--source", type=str, default=None, help="Path to video file (.mp4), image (.jpg), or camera index (0 for webcam)")
    parser.add_argument("--camera_id", type=str, default="cam_bop_north_01", help="Camera ID identifier")
    args = parser.parse_args()

    if args.source:
        if args.source.isdigit() or args.source.endswith((".mp4", ".avi", ".mkv", ".mov")):
            run_video_stream(args.source, args.camera_id)
        else:
            # Single image source
            pipeline = VideoIntelligencePipeline()
            frame = cv2.imread(args.source)
            if frame is not None:
                t0 = time.perf_counter()
                res = pipeline.process_frame(frame, args.camera_id)
                lat = (time.perf_counter() - t0) * 1000
                rendered = draw_hud_surveillance(frame, res, lat)
                out_path = "demo_outputs/custom_annotated.jpg"
                os.makedirs("demo_outputs", exist_ok=True)
                cv2.imwrite(out_path, rendered)
                print(f"Saved annotated image to {out_path}")
            else:
                print(f"Failed to read image: {args.source}")
    else:
        run_default_fixtures()
