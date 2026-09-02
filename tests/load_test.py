"""
Multi-Camera Concurrent Load Test & Benchmark for BAVIS AI / CV Engine
Simulates 3-4 concurrent camera streams hitting POST /infer to measure throughput, latency, and FPS
"""

import time
import base64
import os
import sys

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import cv2
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient

from ai_engine.server import app


def encode_image(img: np.ndarray) -> str:
    _, buf = cv2.imencode(".jpg", img)
    return base64.b64encode(buf).decode("utf-8")


def run_benchmark(num_cameras: int = 4, frames_per_camera: int = 25):
    print(f"\n=======================================================")
    print(f"   BAVIS AI Engine - Multi-Camera Load Test Benchmark")
    print(f"   Simulating {num_cameras} concurrent camera feeds ({frames_per_camera} frames each)")
    print(f"=======================================================\n")

    # Load test frames
    day_img = cv2.imread("tests/fixtures/day_surveillance.jpg")
    night_img = cv2.imread("tests/fixtures/night_surveillance.jpg")
    if day_img is None:
        day_img = np.zeros((720, 1280, 3), dtype=np.uint8)
    if night_img is None:
        night_img = np.zeros((720, 1280, 3), dtype=np.uint8)

    b64_day = encode_image(day_img)
    b64_night = encode_image(night_img)

    latencies = []
    total_detections_count = 0

    with TestClient(app) as client:
        # Pre-warm
        client.get("/health")
        
        def process_camera_stream(cam_index: int):
            cam_id = f"cam_bop_gate_{cam_index:02d}"
            cam_latencies = []
            cam_dets = 0
            
            for f_idx in range(frames_per_camera):
                # Alternate day and night footage
                b64 = b64_night if (f_idx % 2 == 1 and cam_index % 2 == 1) else b64_day
                payload = {
                    "camera_id": cam_id,
                    "frame_base64": b64,
                    "enable_face_detection": True,
                    "enable_anpr": True
                }
                
                t_start = time.perf_counter()
                res = client.post("/infer", json=payload)
                t_end = time.perf_counter()
                
                lat_ms = (t_end - t_start) * 1000
                cam_latencies.append(lat_ms)
                
                if res.status_code == 200:
                    data = res.json()
                    cam_dets += len(data.get("detections", []))
                else:
                    print(f"Error on {cam_id} frame {f_idx}: {res.status_code}")

            return cam_id, cam_latencies, cam_dets

        t0_total = time.perf_counter()
        with ThreadPoolExecutor(max_workers=num_cameras) as executor:
            futures = [executor.submit(process_camera_stream, i + 1) for i in range(num_cameras)]
            for fut in as_completed(futures):
                cam_id, cam_lats, cam_dets = fut.result()
                latencies.extend(cam_lats)
                total_detections_count += cam_dets
                avg_cam_lat = np.mean(cam_lats) if cam_lats else 0
                print(f"[{cam_id}] Processed {len(cam_lats)} frames | Avg Latency: {avg_cam_lat:.2f} ms | Detections: {cam_dets}")

        t1_total = time.perf_counter()
        total_time_sec = t1_total - t0_total
        total_frames = num_cameras * frames_per_camera
        throughput_fps = total_frames / total_time_sec

        print(f"\n---------------- Benchmark Summary ----------------")
        print(f"Total Frames Processed:   {total_frames}")
        print(f"Total Time:               {total_time_sec:.2f} s")
        print(f"System Throughput:        {throughput_fps:.2f} FPS")
        print(f"Mean Request Latency:     {np.mean(latencies):.2f} ms")
        print(f"P95 Request Latency:      {np.percentile(latencies, 95):.2f} ms")
        print(f"Total Detections Logged:  {total_detections_count}")
        print(f"---------------------------------------------------\n")


if __name__ == "__main__":
    from tests.generate_synthetic_stream import create_synthetic_frames
    create_synthetic_frames("tests/fixtures")
    run_benchmark(num_cameras=4, frames_per_camera=20)
