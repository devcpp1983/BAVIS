@echo off
TITLE BAVIS Single-Click Setup and Launcher (Option A)

echo ==========================================================
echo    BAVIS -- Border AI Video Intelligence System
echo    Automated Native Setup and Stack Launcher (Option A)
echo ==========================================================

REM 1. Check or Create Virtual Environment
if not exist "venv\Scripts\python.exe" (
    echo.
    echo [1/6] Creating Python Virtual Environment in root (venv)...
    python -m venv venv
) else (
    echo.
    echo [1/6] Virtual environment found in venv.
)

REM 2. Install Requirements into Virtual Environment
echo.
echo [2/6] Verifying and Installing dependencies from requirements.txt...
venv\Scripts\python.exe -m pip install --upgrade pip
venv\Scripts\python.exe -m pip install -r requirements.txt

REM 3. Seed Database Entities
echo.
echo [3/6] Seeding Database and Demo Feeds...
set PYTHONPATH=%CD%;%CD%\bavis-backend
venv\Scripts\python.exe bavis-backend\scripts\seed_data.py

REM 4. Start AI Vision Engine (Port 8000)
echo.
echo [4/6] Starting AI Vision Engine (Port 8000)...
start "BAVIS AI Engine (8000)" venv\Scripts\python.exe -m uvicorn ai_engine.server:app --host 0.0.0.0 --port 8000

REM 5. Start Event Intelligence Engine (Port 8003)
echo.
echo [5/6] Starting Event Intelligence Engine (Port 8003)...
start "BAVIS Intelligence (8003)" cmd /c "cd bavis-infra\intelligence && ..\..\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8003"

REM 6. Start Backend Gateway API (Port 8001) & Frontend (Port 5173)
echo.
echo [6/6] Starting Backend Gateway (Port 8001) and Frontend Dashboard (Port 5173)...
start "BAVIS Backend API (8001)" cmd /c "cd bavis-backend && set PYTHONPATH=%CD%\..;%CD% && ..\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001"
start "BAVIS Frontend (5173)" cmd /c "cd bavis-frontend && npm run dev"

timeout /t 5 >nul

echo.
echo ==========================================================
echo    BAVIS Multi-Service System Online and Operational!
echo ==========================================================
echo    * Frontend Dashboard:  http://localhost:5173
echo    * Backend API Gateway: http://localhost:8001/docs
echo    * AI Vision Engine:    http://localhost:8000/docs
echo    * Intelligence Engine: http://localhost:8003/health
echo ==========================================================
pause
