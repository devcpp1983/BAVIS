"""
Synthetic Test Data Generator for BAVIS
Creates realistic border simulation frames (day, night, vehicle with plate, person)
for automated pipeline testing and benchmarking without requiring external cameras.
"""

import os
import cv2
import numpy as np


def create_synthetic_frames(output_dir: str = "tests/fixtures"):
    """Generate mock surveillance frames representing standard SIH scenarios."""
    os.makedirs(output_dir, exist_ok=True)

    # 1. Daytime Border Scenario (Person + Vehicle)
    w, h = 1280, 720
    day_frame = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Sky and ground
    day_frame[:int(h * 0.45)] = [220, 200, 160]  # Light sky
    day_frame[int(h * 0.45):] = [60, 90, 70]     # Grass/Dirt ground
    
    # Fence line (Border Fence)
    cv2.line(day_frame, (0, int(h * 0.6)), (w, int(h * 0.6)), (120, 120, 120), 4)
    for x in range(0, w, 40):
        cv2.line(day_frame, (x, int(h * 0.55)), (x, int(h * 0.65)), (100, 100, 100), 2)

    # Draw simulated person (body + head)
    px, py = 450, 380
    cv2.rectangle(day_frame, (px, py + 40), (px + 60, py + 160), (40, 40, 150), -1) # Blue torso & legs
    cv2.circle(day_frame, (px + 30, py + 20), 20, (180, 200, 230), -1)             # Face/Head
    cv2.putText(day_frame, "PERSON", (px, py - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

    # Draw simulated vehicle with license plate
    vx, vy = 750, 400
    cv2.rectangle(day_frame, (vx, vy), (vx + 260, vy + 120), (50, 50, 60), -1)      # Car body
    cv2.rectangle(day_frame, (vx + 40, vy - 50), (vx + 210, vy), (70, 70, 80), -1)  # Cabin
    cv2.circle(day_frame, (vx + 50, vy + 120), 30, (20, 20, 20), -1)                # Wheel 1
    cv2.circle(day_frame, (vx + 210, vy + 120), 30, (20, 20, 20), -1)               # Wheel 2
    
    # License Plate
    plate_x, plate_y = vx + 70, vy + 75
    cv2.rectangle(day_frame, (plate_x, plate_y), (plate_x + 120, plate_y + 35), (255, 255, 255), -1)
    cv2.rectangle(day_frame, (plate_x, plate_y), (plate_x + 120, plate_y + 35), (0, 0, 0), 2)
    cv2.putText(day_frame, "DL01AB1234", (plate_x + 6, plate_y + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)

    day_path = os.path.join(output_dir, "day_surveillance.jpg")
    cv2.imwrite(day_path, day_frame)

    # 2. Night / Low-Light Surveillance Scenario (Dim person walking near fence)
    night_frame = (day_frame.astype(np.float32) * 0.15).astype(np.uint8)
    # Add subtle low-light sensor noise
    noise = np.random.normal(0, 8, night_frame.shape).astype(np.int16)
    night_frame = np.clip(night_frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    night_path = os.path.join(output_dir, "night_surveillance.jpg")
    cv2.imwrite(night_path, night_frame)

    # 3. Clean License Plate Crop (for ANPR testing)
    plate_img = np.full((100, 300, 3), 255, dtype=np.uint8)
    cv2.rectangle(plate_img, (5, 5), (295, 95), (0, 0, 0), 3)
    cv2.putText(plate_img, "IND", (15, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 180), 2)
    cv2.putText(plate_img, "HR26DQ5551", (70, 62), cv2.FONT_HERSHEY_DUPLEX, 1.0, (0, 0, 0), 2)
    
    plate_path = os.path.join(output_dir, "plate_sample.jpg")
    cv2.imwrite(plate_path, plate_img)

    print(f"Generated test fixtures in {output_dir}:")
    print(f" - {day_path}")
    print(f" - {night_path}")
    print(f" - {plate_path}")


if __name__ == "__main__":
    create_synthetic_frames()
