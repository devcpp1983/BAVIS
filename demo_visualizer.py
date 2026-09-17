"""
BAVIS AI / CV - Visual Demo & Test Tool
Runs the complete BAVIS CV pipeline on test images, video files, or live webcam.
Draws bounding boxes, persistent track IDs, face markers, and ANPR plate readings.
"""

import os
import sys

# Ensure root directory is on path and isolate Ultralytics YOLO config locally
_root = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, _root)
_yolo_dir = os.path.join(_root, ".ultralytics")
os.makedirs(_yolo_dir, exist_ok=True)
os.environ["YOLO_CONFIG_DIR"] = _yolo_dir
os.environ["ULTRALYTICS_CONFIG_DIR"] = _yolo_dir

import argparse
import time
import cv2
import numpy as np

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
        bx1, by1, bx2, by2 = det.bbox
        if max(det.bbox) <= 1.0:
            x1, y1, x2, y2 = int(bx1 * w), int(by1 * h), int(bx2 * w), int(by2 * h)
        else:
            x1, y1, x2, y2 = int(bx1), int(by1), int(bx2), int(by2)
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


# Global mouse state for interactive custom fence drawing
mouse_state = {
    "is_drawing": False,
    "start_pt": None,
    "curr_pt": None,
    "active_tile": None,
    "custom_lines": {}  # tile_idx (0..3) -> (p1, p2) in local tile coordinates (0..640, 0..360)
}


def on_mouse_event(event, x, y, flags, param):
    """Handle mouse drag events to draw custom virtual fence lines on any camera feed."""
    global mouse_state
    tile_w, tile_h = 640, 360
    tile_x = min(1, max(0, x // tile_w))
    tile_y = min(1, max(0, y // tile_h))
    tile_idx = tile_y * 2 + tile_x

    local_x = x % tile_w
    local_y = y % tile_h

    if event == cv2.EVENT_LBUTTONDOWN:
        mouse_state["is_drawing"] = True
        mouse_state["start_pt"] = (local_x, local_y)
        mouse_state["curr_pt"] = (local_x, local_y)
        mouse_state["active_tile"] = tile_idx

    elif event == cv2.EVENT_MOUSEMOVE and mouse_state["is_drawing"]:
        mouse_state["curr_pt"] = (local_x, local_y)

    elif event == cv2.EVENT_LBUTTONUP and mouse_state["is_drawing"]:
        mouse_state["is_drawing"] = False
        p1 = mouse_state["start_pt"]
        p2 = (local_x, local_y)
        if abs(p1[0] - p2[0]) > 5 or abs(p1[1] - p2[1]) > 5:
            mouse_state["custom_lines"][mouse_state["active_tile"]] = (p1, p2)
            print(f"✏️ [CUSTOM FENCE DRAWN] Tile {mouse_state['active_tile']}: {p1} -> {p2}")

    elif event == cv2.EVENT_RBUTTONDOWN:
        if tile_idx in mouse_state["custom_lines"]:
            del mouse_state["custom_lines"][tile_idx]
            print(f"🗑️ [CUSTOM FENCE CLEARED] Tile {tile_idx}")


def check_line_intersection(p1: tuple, p2: tuple, bbox: tuple) -> bool:
    """Check if line segment (p1, p2) intersects bounding box (bx1, by1, bx2, by2)."""
    bx1, by1, bx2, by2 = bbox
    edges = [
        ((bx1, by1), (bx2, by1)),
        ((bx1, by2), (bx2, by2)),
        ((bx1, by1), (bx1, by2)),
        ((bx2, by1), (bx2, by2)),
        (((bx1 + bx2) // 2, by1), ((bx1 + bx2) // 2, by2))
    ]

    def ccw(A, B, C):
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

    def intersect(A, B, C, D):
        return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

    for edge_start, edge_end in edges:
        if intersect(p1, p2, edge_start, edge_end):
            return True
    return False


def load_video_stack(stack_config):
    """Helper to open VideoCapture objects for a given stack config."""
    caps = []
    for idx, (path, cam_id, label, fence_ratio) in enumerate(stack_config):
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path):
            fallback_name = f"cam{idx+1}.mp4"
            abs_path = os.path.abspath(os.path.join("bavis-frontend", "public", "videos", fallback_name))
        cap = cv2.VideoCapture(abs_path)
        caps.append({
            "cap": cap,
            "camera_id": cam_id,
            "label": label,
            "fence_ratio": fence_ratio,
            "path": abs_path,
            "cached_res": None,
            "last_breach_ts": 0,
            "captured_tracks": set()
        })
    return caps


def run_2x2_grid(initial_preset: str = "alpha"):
    """Run 4 video streams concurrently in a zero-lag 2x2 surveillance matrix with interactive mouse fence drawing & multi-stack support."""
    global mouse_state

    # Stack 1: Sector Alpha (Plains / Border Post / Checkpost)
    stack_alpha = [
        ("videos/Static_fixed_angle_CCTV_securi.mp4", "CAM-BOP-01", "BOP Sector Alpha", 0.55),
        ("videos/Static_fixed_angle_CCTV_securi2.mp4", "CAM-BOP-02", "Patrol Route Bravo", 0.50),
        ("videos/Static_fixed_angle_CCTV_secur3i.mp4", "CAM-CHECKPOST-01", "International Checkpost", 0.60),
        ("videos/Video_—_Overhead_top_down.mp4", "CAM-ROAD-NORTH", "Perimeter Highway", 0.55)
    ]

    # Stack 2: High Altitude Mountain Sector (Himalayan / Mountain Terrain)
    stack_mountain = [
        ("videos/WhatsApp Video 2026-09-04 at 9.47.27 AM.mp4", "CAM-MNT-RIDGE", "High Altitude Mountain Ridge", 0.55),
        ("videos/WhatsApp Video 2026-09-04 at 10.13.44 AM.mp4", "CAM-MNT-VALLEY", "Mountain Valley Pass", 0.50),
        ("videos/WhatsApp Video 2026-09-04 at 10.21.10 AM.mp4", "CAM-MNT-PEAK", "High Altitude Peak Watch", 0.55),
        ("videos/WhatsApp Video 2026-09-04 at 10.44.04 AM.mp4", "CAM-MNT-GORGE", "Glacier River Gorge", 0.55)
    ]

    current_stack_name = "mountain" if initial_preset in ["mountain", "mountains", "2"] else "alpha"
    active_stack_config = stack_mountain if current_stack_name == "mountain" else stack_alpha

    pipeline = VideoIntelligencePipeline()
    caps = load_video_stack(active_stack_config)

    breach_dir = os.path.abspath("demo_outputs/evidence_breaches")
    plate_dir = os.path.abspath("demo_outputs/evidence_plates")
    os.makedirs(breach_dir, exist_ok=True)
    os.makedirs(plate_dir, exist_ok=True)

    print("\n==========================================================")
    print("   BAVIS Multi-Sector 2x2 Surveillance Matrix Launcher")
    print("==========================================================")
    print(f"ACTIVE SECTOR STACK: {current_stack_name.upper()}")
    print("🖱️  LEFT-CLICK & DRAG : Draw custom perimeter fence line anywhere!")
    print("🖱️  RIGHT-CLICK       : Clear line on clicked camera feed")
    print("⌨️   PRESS [TAB] / [1] / [2] : Switch Video Stack (Sector Alpha <-> Mountain Sector)")
    print("⌨️   PRESS 'C'        : Clear all custom lines")
    print("⌨️   PRESS 'E'        : Open evidence folder in Windows Explorer")
    print("⌨️   PRESS 'Q'        : Quit demo\n")

    window_name = "BAVIS - Multi-Sector 2x2 Surveillance Matrix (AI Live)"
    cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)
    cv2.setMouseCallback(window_name, on_mouse_event)

    target_w, target_h = 640, 360
    frame_count = 0

    while True:
        frame_count += 1
        processed_tiles = []
        should_infer = (frame_count % 2 == 0)

        for tile_idx, item in enumerate(caps):
            cap = item["cap"]
            cam_id = item["camera_id"]
            label = item["label"]

            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = cap.read()
                if not ret:
                    frame = np.zeros((target_h, target_w, 3), dtype=np.uint8)

            frame = cv2.resize(frame, (target_w, target_h))
            h, w = frame.shape[:2]

            t0 = time.perf_counter()
            if should_infer or item["cached_res"] is None:
                response = pipeline.process_frame(
                    frame_bgr=frame,
                    camera_id=cam_id,
                    enable_face=False,
                    enable_anpr=False
                )
                item["cached_res"] = response
            else:
                response = item["cached_res"]

            lat_ms = (time.perf_counter() - t0) * 1000
            annotated = frame.copy()

            # Determine Active Virtual Fence Line (Only if user has drawn a custom line)
            has_custom_line = (tile_idx in mouse_state["custom_lines"])
            breach_active = False
            active_breach_track = ""

            if has_custom_line:
                fence_p1, fence_p2 = mouse_state["custom_lines"][tile_idx]

                # Evaluate Detections against Custom Fence Line
                for det in response.detections:
                    bx1, by1, bx2, by2 = det.bbox
                    if max(det.bbox) <= 1.0:
                        x1, y1, x2, y2 = int(bx1 * w), int(by1 * h), int(bx2 * w), int(by2 * h)
                    else:
                        x1, y1, x2, y2 = int(bx1), int(by1), int(bx2), int(by2)

                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w - 1, x2), min(h - 1, y2)

                    obj_type = det.object_type
                    conf = det.confidence
                    track_id = det.track_id
                    track_key = f"{cam_id}_{track_id}"

                    is_breached = check_line_intersection(fence_p1, fence_p2, (x1, y1, x2, y2))

                    if is_breached:
                        breach_active = True
                        active_breach_track = f"{obj_type.upper()} #{track_id}"
                        color = (0, 0, 255)  # Bright Red for Breach

                        if track_key not in item["captured_tracks"]:
                            crop_img = frame[y1:y2, x1:x2]
                            if crop_img.size > 0:
                                snap_filename = f"BREACH_{obj_type.upper()}_{cam_id}_{track_id}.jpg"
                                snap_path = os.path.join(breach_dir, snap_filename)
                                cv2.imwrite(snap_path, crop_img)
                                item["captured_tracks"].add(track_key)
                                item["last_breach_ts"] = time.time()
                                print(f"📸 [AUTOMATED EVIDENCE CAPTURE] {obj_type.upper()} Breach Photo Saved -> {snap_path}")

                    if obj_type == "person":
                        if not is_breached:
                            color = (255, 100, 0)
                        label_text = f"{track_id} | PERSON {int(conf * 100)}%"

                    elif obj_type == "vehicle":
                        if not is_breached:
                            color = (0, 200, 255)
                        label_text = f"{track_id} | VEHICLE {int(conf * 100)}%"

                        # Also save vehicle plate snapshot
                        plate_key = f"plate_{track_key}"
                        if plate_key not in item["captured_tracks"]:
                            vehicle_crop = frame[y1:y2, x1:x2]
                            if vehicle_crop.size > 0:
                                snap_filename = f"PLATE_{cam_id}_{track_id}.jpg"
                                snap_path = os.path.join(plate_dir, snap_filename)
                                cv2.imwrite(snap_path, vehicle_crop)
                                item["captured_tracks"].add(plate_key)
                                print(f"📸 [AUTOMATED EVIDENCE CAPTURE] Vehicle Plate Photo Saved -> {snap_path}")

                    else:
                        color = (255, 255, 255)
                        label_text = f"{track_id} | {obj_type.upper()}"

                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                    (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                    cv2.rectangle(annotated, (x1, max(0, y1 - th - 8)), (x1 + tw + 8, y1), color, -1)
                    cv2.putText(annotated, label_text, (x1 + 4, max(th, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

                fence_color = (0, 0, 255) if breach_active else (0, 255, 255)
                cv2.line(annotated, fence_p1, fence_p2, fence_color, 3)
                cv2.putText(annotated, f"CUSTOM FENCE ({cam_id})", (fence_p1[0] + 10, max(20, fence_p1[1] - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, fence_color, 1, cv2.LINE_AA)

            else:
                for det in response.detections:
                    bx1, by1, bx2, by2 = det.bbox
                    if max(det.bbox) <= 1.0:
                        x1, y1, x2, y2 = int(bx1 * w), int(by1 * h), int(bx2 * w), int(by2 * h)
                    else:
                        x1, y1, x2, y2 = int(bx1), int(by1), int(bx2), int(by2)

                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w - 1, x2), min(h - 1, y2)

                    obj_type = det.object_type
                    conf = det.confidence
                    track_id = det.track_id
                    track_key = f"{cam_id}_{track_id}"

                    if obj_type == "person":
                        color = (255, 100, 0)
                        label_text = f"{track_id} | PERSON {int(conf * 100)}%"
                    elif obj_type == "vehicle":
                        color = (0, 200, 255)
                        label_text = f"{track_id} | VEHICLE {int(conf * 100)}%"

                        if track_key not in item["captured_tracks"]:
                            vehicle_crop = frame[y1:y2, x1:x2]
                            if vehicle_crop.size > 0:
                                snap_filename = f"PLATE_{cam_id}_{track_id}.jpg"
                                snap_path = os.path.join(plate_dir, snap_filename)
                                cv2.imwrite(snap_path, vehicle_crop)
                                item["captured_tracks"].add(track_key)
                                print(f"📸 [AUTOMATED EVIDENCE CAPTURE] Vehicle Plate Photo Saved -> {snap_path}")
                    else:
                        color = (255, 255, 255)
                        label_text = f"{track_id} | {obj_type.upper()}"

                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                    (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                    cv2.rectangle(annotated, (x1, max(0, y1 - th - 8)), (x1 + tw + 8, y1), color, -1)
                    cv2.putText(annotated, label_text, (x1 + 4, max(th, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

            if mouse_state["is_drawing"] and mouse_state["active_tile"] == tile_idx:
                cv2.line(annotated, mouse_state["start_pt"], mouse_state["curr_pt"], (255, 255, 0), 2, cv2.LINE_AA)
                cv2.circle(annotated, mouse_state["start_pt"], 4, (0, 255, 255), -1)
                cv2.circle(annotated, mouse_state["curr_pt"], 4, (0, 255, 255), -1)

            if breach_active or (time.time() - item["last_breach_ts"] < 2.0):
                cv2.rectangle(annotated, (0, h - 35), (w, h), (0, 0, 200), -1)
                cv2.putText(annotated, f"🚨 PERIMETER BREACH CAPTURED! [PERSON {active_breach_track}] - PHOTO SAVED",
                            (15, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 2, cv2.LINE_AA)

            cv2.rectangle(annotated, (10, 10), (320, 50), (20, 20, 20), -1)
            cv2.rectangle(annotated, (10, 10), (320, 50), (0, 255, 200), 1)
            cv2.putText(annotated, f"{label} ({cam_id})", (18, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 200), 1, cv2.LINE_AA)
            cv2.putText(annotated, f"LIVE | LATENCY: {lat_ms:.1f}ms | 30 FPS", (18, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (200, 200, 200), 1)

            processed_tiles.append(annotated)

        if len(processed_tiles) == 4:
            top_row = np.hstack((processed_tiles[0], processed_tiles[1]))
            bottom_row = np.hstack((processed_tiles[2], processed_tiles[3]))
            grid_matrix = np.vstack((top_row, bottom_row))

            cv2.rectangle(grid_matrix, (0, 0), (1280, 24), (10, 10, 10), -1)
            sector_name = "SECTOR ALPHA (BORDER FENCE & POSTS)" if current_stack_name == "alpha" else "SECTOR HIMALAYA (HIGH ALTITUDE MOUNTAIN TERRAIN)"
            cv2.putText(grid_matrix, f"SECTOR: {sector_name} | [TAB] Switch Stack | 🖱️ Drag: Draw Fence | [C] Clear | [E] Evidence | [Q] Quit",
                        (15, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 255, 200), 1, cv2.LINE_AA)

            cv2.imshow(window_name, grid_matrix)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == 9 or key == ord('1') or key == ord('2'):  # 9 is TAB ASCII code
            for item in caps:
                item["cap"].release()
            
            current_stack_name = "mountain" if current_stack_name == "alpha" else "alpha"
            active_stack_config = stack_mountain if current_stack_name == "mountain" else stack_alpha
            caps = load_video_stack(active_stack_config)
            mouse_state["custom_lines"].clear()
            print(f"🔄 [STACK SWITCHED] Loaded {current_stack_name.upper()} Video Stack.")

        elif key == ord('c') or key == ord('C'):
            mouse_state["custom_lines"].clear()
            print("🗑️ [CUSTOM FENCES CLEARED] All custom drawn lines reset.")
        elif key == ord('e') or key == ord('E'):
            try:
                import subprocess
                subprocess.Popen(["explorer.exe", os.path.abspath("demo_outputs")])
                print("📂 [EXPLORER LAUNCHED] Opened evidence folder: demo_outputs/")
            except Exception as ex:
                print(f"Error launching explorer: {ex}")

    for item in caps:
        item["cap"].release()
    cv2.destroyAllWindows()
    print("[INFO] Closed 2x2 Surveillance Matrix.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BAVIS Visual Demo & Test Tool")
    parser.add_argument("--source", type=str, default=None, help="Path to video file (.mp4), image (.jpg), or camera index (0 for webcam)")
    parser.add_argument("--grid", action="store_true", help="Launch 2x2 multi-camera surveillance matrix grid")
    parser.add_argument("--preset", type=str, default="alpha", choices=["alpha", "mountain"], help="Video stack preset (alpha or mountain)")
    parser.add_argument("--camera_id", type=str, default="cam_bop_north_01", help="Camera ID identifier")
    args = parser.parse_args()

    if args.grid or args.source == "2x2" or args.source == "grid":
        run_2x2_grid(initial_preset=args.preset)
    elif args.source:
        if args.source.isdigit() or args.source.endswith((".mp4", ".avi", ".mkv", ".mov")):
            run_video_stream(args.source, args.camera_id)
        else:
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




if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BAVIS Visual Demo & Test Tool")
    parser.add_argument("--source", type=str, default=None, help="Path to video file (.mp4), image (.jpg), or camera index (0 for webcam)")
    parser.add_argument("--grid", action="store_true", help="Launch 2x2 multi-camera surveillance matrix grid")
    parser.add_argument("--camera_id", type=str, default="cam_bop_north_01", help="Camera ID identifier")
    args = parser.parse_args()

    if args.grid or args.source == "2x2" or args.source == "grid":
        run_2x2_grid()
    elif args.source:
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


