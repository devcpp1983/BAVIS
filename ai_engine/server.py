"""
BAVIS AI / CV - FastAPI Inference Service
Provides HTTP API endpoints exposing the detection contract to Ingestion and Backend
"""

import io
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np

from ai_engine.config import config
from ai_engine.schemas import (
    InferRequest,
    InferResponse,
    HealthResponse,
    MetricsResponse,
    DetectionEvent
)
from ai_engine.pipeline import VideoIntelligencePipeline

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bavis.server")

# Global pipeline instance
pipeline: VideoIntelligencePipeline | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline
    logger.info("Starting BAVIS AI Inference Server...")
    pipeline = VideoIntelligencePipeline()
    logger.info("BAVIS AI Engine ready to accept frames.")
    yield
    logger.info("Shutting down BAVIS AI Inference Server...")


app = FastAPI(
    title="BAVIS - Border AI Video Intelligence Service",
    description="Real-time Computer Vision Inference Engine for SIH26187 (SSB / MHA)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Frontend Operator Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
async def root():
    return {
        "system": "BAVIS - Border AI Video Intelligence System",
        "workstream": "Workstream A - AI / Computer Vision Engine",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/health", response_model=HealthResponse, tags=["Diagnostics"])
async def health_check():
    """Health check endpoint indicating model loading status and GPU availability."""
    import torch
    gpu_avail = torch.cuda.is_available() if hasattr(torch, "cuda") else False
    device_name = torch.cuda.get_device_name(0) if gpu_avail else None

    return HealthResponse(
        status="healthy" if pipeline is not None else "initializing",
        device=config.device,
        gpu_available=gpu_avail,
        gpu_device_name=device_name,
        loaded_models={
            "yolo_detector": pipeline.detector.model is not None if pipeline else False,
            "tracker": pipeline is not None,
            "face_detector": pipeline.face_detector.cascade is not None if pipeline else False,
            "anpr_ocr": pipeline.anpr_pipeline.ocr_engine is not None if pipeline else False,
            "low_light_enhancer": True
        }
    )


@app.get("/metrics", response_model=MetricsResponse, tags=["Diagnostics"])
async def get_metrics():
    """Real-time throughput, FPS and latency metrics across connected camera feeds."""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    return pipeline.get_metrics()


@app.post("/infer", response_model=InferResponse, tags=["Inference"])
async def infer_frame_json(req: InferRequest):
    """
    Primary JSON-based inference endpoint.
    Accepts Base64 frame + camera_id and returns standardized detections.
    """
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    try:
        frame_bgr = pipeline.decode_base64_frame(req.frame_base64)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid base64 frame encoding: {str(e)}"
        )

    response = pipeline.process_frame(
        frame_bgr=frame_bgr,
        camera_id=req.camera_id,
        frame_ts=req.frame_ts,
        enable_face=req.enable_face_detection,
        enable_anpr=req.enable_anpr,
        force_low_light=req.force_low_light_mode
    )
    return response


@app.post("/infer/upload", response_model=InferResponse, tags=["Inference"])
async def infer_frame_upload(
    camera_id: str = Form("cam_01"),
    frame_ts: str | None = Form(None),
    enable_face: bool = Form(True),
    enable_anpr: bool = Form(True),
    force_low_light: bool | None = Form(None),
    file: UploadFile = File(...)
):
    """
    Multipart file-upload inference endpoint for easy testing from Swagger UI or curl.
    """
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame_bgr is None:
        raise HTTPException(status_code=400, detail="Could not decode uploaded image file.")

    return pipeline.process_frame(
        frame_bgr=frame_bgr,
        camera_id=camera_id,
        frame_ts=frame_ts,
        enable_face=enable_face,
        enable_anpr=enable_anpr,
        force_low_light=force_low_light
    )


@app.post("/infer/anpr", tags=["Inference"])
async def infer_plate_direct(file: UploadFile = File(...)):
    """
    Direct OCR endpoint for license plate crops.
    """
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    crop_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if crop_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    text, conf = pipeline.anpr_pipeline.read_text(crop_bgr)
    return {
        "plate_text": text,
        "confidence": conf
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai_engine.server:app", host=config.host, port=config.port, reload=True)
