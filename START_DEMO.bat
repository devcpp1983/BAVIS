@echo off
TITLE BAVIS SIH 26187 Demo Launcher
COLOR 0A

echo ==========================================================
echo    BAVIS -- Border AI Video Intelligence System
echo    SIH PS 26187 -- Official Demo Launcher
echo ==========================================================
echo.

echo Cleaning up any old leftover background processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8003 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

if exist venv\Scripts\python.exe goto HAVE_VENV
echo [1/5] Creating Python Virtual Environment (venv)...
python -m venv venv

:HAVE_VENV
echo [1/5] Virtual environment ready.

echo [2/5] Checking Python dependencies...
venv\Scripts\python.exe -m pip install --default-timeout=120 -r requirements.txt

echo [3/5] Seeding SQLite Database and Preparing Demo Video Feeds...
set PYTHONPATH=%CD%;%CD%\bavis-backend
venv\Scripts\python.exe bavis-backend\scripts\seed_data.py

if exist bavis-frontend\node_modules goto HAVE_NODE_MODULES
echo [4/5] Installing frontend node_modules...
cd bavis-frontend
cmd /c npm install
cd ..

:HAVE_NODE_MODULES
echo [4/5] Frontend dependencies ready.

echo.
echo [5/5] Launching BAVIS Services and Frontend Dashboard...

start "BAVIS AI Engine (Port 8000)" cmd /k "venv\Scripts\python.exe -m uvicorn ai_engine.server:app --host 0.0.0.0 --port 8000"
start "BAVIS Intelligence Engine (Port 8003)" cmd /k "cd bavis-infra\intelligence && ..\..\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8003"
start "BAVIS Backend Gateway (Port 8001)" cmd /k "cd bavis-backend && set PYTHONPATH=%CD%\..;%CD% && ..\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001"
start "BAVIS Frontend (Port 5173)" cmd /k "cd bavis-frontend && npm run dev"

echo.
echo ==========================================================
echo    BAVIS System Online!
echo    * AI Engine:    http://localhost:8000/docs
echo    * Backend API:  http://localhost:8001/docs
echo    * Intelligence: http://localhost:8003/docs
echo    * Dashboard:    http://localhost:5173
echo ==========================================================
ping 127.0.0.1 -n 4 >nul
start http://localhost:5173
