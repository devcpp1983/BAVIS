import os
import cv2
import numpy as np


def generate_demo_videos():
    video_dir = "./data/videos"
    os.makedirs(video_dir, exist_ok=True)

    cameras = [
        ("cam1.mp4", "CAM-BOP-01 (Border Post Alpha)", (0, 255, 0)),
        ("cam2.mp4", "CAM-BOP-02 (Patrol Route North)", (255, 165, 0)),
        ("cam3.mp4", "CAM-CHECKPOST-01 (Checkpost Charlie)", (0, 191, 255)),
        ("cam4.mp4", "CAM-ROAD-NORTH (Border Highway)", (255, 0, 255))
    ]

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps = 20
    duration_sec = 8
    num_frames = fps * duration_sec

    for filename, label, color in cameras:
        filepath = os.path.join(video_dir, filename)
        if os.path.exists(filepath):
            continue

        writer = cv2.VideoWriter(filepath, fourcc, fps, (640, 360))

        for f in range(num_frames):
            frame = np.zeros((360, 640, 3), dtype=np.uint8)
            
            # Grid background
            for y in range(0, 360, 40):
                cv2.line(frame, (0, y), (640, y), (30, 30, 30), 1)
            for x in range(0, 640, 40):
                cv2.line(frame, (x, 0), (x, 360), (30, 30, 30), 1)

            # Draw virtual fence line
            cv2.line(frame, (100, 250), (540, 250), (0, 0, 255), 2)
            cv2.putText(frame, "RESTRICTED FENCE LINE", (110, 245),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

            # Move target object across frame
            box_x = int((f / num_frames) * 500) + 50
            box_y = 200 + int(np.sin(f / 10.0) * 30)

            # Draw simulated person/vehicle bounding box
            cv2.rectangle(frame, (box_x, box_y), (box_x + 60, box_y + 90), color, 2)
            cv2.putText(frame, f"TARGET TRK-{f%10+100}", (box_x, box_y - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

            # Overlay Camera Metadata
            cv2.putText(frame, f"BAVIS CCTV FEED: {label}", (15, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(frame, "REC [●]", (550, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

            writer.write(frame)

        writer.release()
        print(f"Generated synthetic demo video feed: {filepath}")


if __name__ == "__main__":
    generate_demo_videos()
