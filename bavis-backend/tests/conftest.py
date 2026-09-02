import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import get_password_hash
from app.models.domain import User, Camera

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def prepare_database():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed test users and camera
    async with TestingSessionLocal() as session:
        admin = User(username="admin_test", hashed_password=get_password_hash("pass123"), role="admin")
        operator = User(username="operator_test", hashed_password=get_password_hash("pass123"), role="operator")
        camera = Camera(
            camera_id="CAM-TEST-01",
            name="Test Camera",
            location_code="LOC-01",
            stream_url="./data/videos/cam1.mp4",
            status="online",
            configuration={}
        )
        session.add_all([admin, operator, camera])
        await session.commit()

    yield

    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
