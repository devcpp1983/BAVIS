import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.v1.endpoints import auth, cameras, events, alerts, zones, evidence, websockets
from app.services.ingestion import ingestion_manager

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bavis.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if using SQLite / direct SQLAlchemy
    logger.info("Initializing BAVIS Backend & Database Schemas...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed demo data if database is fresh
    from scripts.seed_data import seed_database
    await seed_database()

    # Start Video Ingestion Manager
    await ingestion_manager.start_all()

    yield

    # Shutdown
    logger.info("Shutting down BAVIS Ingestion Manager...")
    await ingestion_manager.stop_all()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(cameras.router, prefix=f"{settings.API_V1_STR}/cameras", tags=["Cameras"])
app.include_router(events.router, prefix=f"{settings.API_V1_STR}/events", tags=["Events & Detections"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Alerts"])
app.include_router(zones.router, prefix=f"{settings.API_V1_STR}/zones", tags=["Zones & Rules"])
app.include_router(evidence.router, prefix=f"{settings.API_V1_STR}/evidence", tags=["Evidence"])
app.include_router(websockets.router, prefix="/alerts", tags=["Real-time WebSockets"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "system": "BAVIS (Border AI Video Intelligence System)",
        "workstream": "Backend / Ingestion Gateway",
        "status": "OPERATIONAL",
        "api_docs": "/docs"
    }
