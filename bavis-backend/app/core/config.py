import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BAVIS - Border AI Video Intelligence System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "bavis-super-secret-key-change-this-in-production-sih2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./bavis.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Ingestion & Video
    FRAME_SAMPLE_FPS: float = 5.0
    DEFAULT_VIDEO_DIR: str = "./data/videos"
    EVIDENCE_DIR: str = "./data/evidence"

    # AI Integration
    AI_ENGINE_URL: str = "http://localhost:8001/predict"
    USE_MOCK_AI: bool = True

    # C2 Webhook
    C2_WEBHOOK_URL: str = "http://localhost:9000/webhook/c2"

    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

# Ensure data directories exist
os.makedirs(settings.DEFAULT_VIDEO_DIR, exist_ok=True)
os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
