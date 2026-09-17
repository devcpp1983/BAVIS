# BAVIS -- SIH PS 26187 Master Service Launcher
$Host.UI.RawUI.WindowTitle = "BAVIS -- SIH 26187 Master Launcher"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   BAVIS -- Border AI Video Intelligence System" -ForegroundColor Green
Write-Host "   SIH PS 26187 -- Master Service Launcher" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

# 1. Clean up old background processes
Write-Host "[1/5] Terminating any stale python/node processes..." -ForegroundColor Yellow
$ports = @(8000, 8001, 8003, 5173)
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# 2. Virtual Environment Check
if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "[2/5] Creating Python Virtual Environment (venv)..." -ForegroundColor Yellow
    python -m venv venv
} else {
    Write-Host "[2/5] Virtual environment ready." -ForegroundColor Cyan
}

# 3. Seed Database & Demo Videos
Write-Host "[3/5] Seeding SQLite Database & Preparing Demo Video Feeds..." -ForegroundColor Yellow
$env:PYTHONPATH = "e:\BAVIS;e:\BAVIS\bavis-backend"
$env:YOLO_CONFIG_DIR = "e:\BAVIS\.ultralytics"
$env:ULTRALYTICS_CONFIG_DIR = "e:\BAVIS\.ultralytics"
.\venv\Scripts\python.exe bavis-backend\scripts\seed_data.py

# 4. Check Frontend node_modules
Write-Host "[4/5] Checking Frontend node_modules..." -ForegroundColor Yellow
if (-not (Test-Path "bavis-frontend\node_modules")) {
    Set-Location bavis-frontend
    npm install
    Set-Location ..
}

# 5. Launch All 4 Microservices in New Windows
Write-Host "[5/5] Spawning BAVIS Microservices..." -ForegroundColor Green

Start-Process cmd -ArgumentList '/k "title BAVIS AI Engine (Port 8000) & e:\BAVIS\venv\Scripts\python.exe -m uvicorn ai_engine.server:app --host 0.0.0.0 --port 8000"' -WindowStyle Normal
Start-Process cmd -ArgumentList '/k "title BAVIS Intelligence Engine (Port 8003) & cd /d e:\BAVIS\bavis-infra\intelligence & e:\BAVIS\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8003"' -WindowStyle Normal
Start-Process cmd -ArgumentList '/k "title BAVIS Backend Gateway (Port 8001) & cd /d e:\BAVIS\bavis-backend & set PYTHONPATH=e:\BAVIS;e:\BAVIS\bavis-backend & e:\BAVIS\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001"' -WindowStyle Normal
Start-Process cmd -ArgumentList '/k "title BAVIS Frontend (Port 5173) & cd /d e:\BAVIS\bavis-frontend & npm run dev"' -WindowStyle Normal

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   BAVIS Master System Fully Connected!" -ForegroundColor Green
Write-Host "   * AI Engine:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   * Backend API:  http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host "   * Intelligence: http://localhost:8003/docs" -ForegroundColor Cyan
Write-Host "   * Dashboard:    http://localhost:5173" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

Start-Sleep -Seconds 4
Start-Process "http://localhost:5173"
