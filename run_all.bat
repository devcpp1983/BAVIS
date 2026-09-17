@echo off
TITLE BAVIS Multi-Service Orchestrator

echo ==========================================================
echo    BAVIS -- Border AI Video Intelligence System
echo    Single-Laptop Multi-Service Orchestrator
echo ==========================================================

echo.
echo [1/5] Seeding SQLite Database and Demo Entities...
set PYTHONPATH=%CD%;%CD%\bavis-backend
python bavis-backend\scripts\seed_data.py

echo.
echo [2/5] Starting AI Vision Engine (Port 8000)...
start "BAVIS AI Engine (8000)" python -m uvicorn ai_engine.server:app --host 0.0.0.0 --port 8000

echo.
echo [3/5] Starting Event Intelligence Engine (Port 8003)...
start "BAVIS Intelligence (8003)" cmd /c "cd bavis-infra\intelligence && python -m uvicorn main:app --host 0.0.0.0 --port 8003"

echo.
echo [4/5] Starting Backend Gateway API (Port 8001)...
start "BAVIS Backend API (8001)" cmd /c "cd bavis-backend && set PYTHONPATH=%CD%\..;%CD% && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001"

echo.
echo [5/5] Starting Frontend Operator Dashboard (Port 5173)...
start "BAVIS Frontend (5173)" cmd /c "cd bavis-frontend && npm run dev"

timeout /t 5 >nul

echo.
echo ==========================================================
echo    BAVIS Multi-Service Stack Online and Operational!
echo ==========================================================
echo    * Frontend Dashboard:  http://localhost:5173
echo    * Backend API Gateway: http://localhost:8001/docs
echo    * AI Vision Engine:    http://localhost:8000/docs
echo    * Intelligence Engine: http://localhost:8003/health
echo ==========================================================
pause
