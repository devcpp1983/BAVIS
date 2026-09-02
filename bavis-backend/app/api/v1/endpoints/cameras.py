import os
import cv2
import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.domain import Camera, User
from app.schemas.contract import CameraOut, CameraCreate
from app.api.deps import require_operator, require_supervisor

router = APIRouter()


@router.get("", response_model=List[CameraOut])
async def list_cameras(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    stmt = select(Camera)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=CameraOut, status_code=status.HTTP_201_CREATED)
async def create_camera(
    camera_in: CameraCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    stmt = select(Camera).where(Camera.camera_id == camera_in.camera_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Camera ID already exists")

    camera = Camera(
        camera_id=camera_in.camera_id,
        name=camera_in.name,
        location_code=camera_in.location_code,
        stream_url=camera_in.stream_url,
        status=camera_in.status,
        configuration=camera_in.configuration or {}
    )
    db.add(camera)
    await db.commit()
    await db.refresh(camera)
    return camera


def gen_frames(stream_url: str):
    """MJPEG Frame Generator for demo dashboard live view stream."""
    import time
    import numpy as np

    os.environ['OPENCV_FFMPEG_CAPTURE_OPTIONS'] = 'ssl_verify;0'

    is_network_url = stream_url.startswith(("http://", "https://", "rtsp://", "rtmp://"))
    target_url = stream_url
    if stream_url.startswith(("http://", "https://")) and not stream_url.endswith(('/video', '/mjpeg', '/shot.jpg')):
        target_url = stream_url.rstrip('/') + '/video'

    cap = None
    if os.path.exists(stream_url) or is_network_url:
        try:
            cap = cv2.VideoCapture(target_url if is_network_url else stream_url)
            if not cap.isOpened() and target_url != stream_url:
                cap = cv2.VideoCapture(stream_url)
        except Exception:
            cap = None

    if cap and cap.isOpened():
        try:
            consecutive_failures = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    consecutive_failures += 1
                    if is_network_url:
                        if consecutive_failures > 10:
                            # Try re-opening network stream
                            cap.open(target_url)
                            consecutive_failures = 0
                        time.sleep(0.1)
                        continue
                    else:
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                
                consecutive_failures = 0
                frame_resized = cv2.resize(frame, (640, 360))
                _, buffer = cv2.imencode('.jpg', frame_resized)
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                time.sleep(0.04)  # ~25 fps
        finally:
            cap.release()
    else:
        # Fallback synthetic frame if stream unavailable
        while True:
            img = np.zeros((360, 640, 3), np.uint8)
            cv2.putText(img, f"BAVIS FEED (OFFLINE): {stream_url}", (30, 180),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            _, buffer = cv2.imencode('.jpg', img)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.1)


@router.get("/{id}/stream")
async def get_camera_stream(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Camera).where(Camera.camera_id == id)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    return StreamingResponse(
        gen_frames(camera.stream_url),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
