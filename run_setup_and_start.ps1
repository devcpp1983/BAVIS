# BAVIS — Single-Click Native Setup and Runner (Option A)
# Automatically creates venv, installs requirements, seeds DB, and starts all services

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot
$VenvPath = Join-Path $WorkspaceRoot "venv"
$VenvPython = Join-Path $VenvPath "Scripts\python.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   BAVIS -- Border AI Video Intelligence System" -ForegroundColor Cyan
Write-Host "   Automated Native Setup and Stack Launcher (Option A)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check or Create Virtual Environment
if (-not (Test-Path $VenvPython)) {
    Write-Host "`n[1/6] Creating Python Virtual Environment in root (venv)..." -ForegroundColor Yellow
    python -m venv "$VenvPath"
    Write-Host "Virtual environment created at: $VenvPath" -ForegroundColor Green
} else {
    Write-Host "`n[1/6] Virtual environment found at: $VenvPath" -ForegroundColor Green
}

# 2. Install Requirements into Virtual Environment
Write-Host "`n[2/6] Verifying and Installing dependencies from requirements.txt..." -ForegroundColor Yellow
$ReqFile = Join-Path $WorkspaceRoot "requirements.txt"
& "$VenvPython" -m pip install --upgrade pip
& "$VenvPython" -m pip install -r "$ReqFile"

# 3. Seed Database Entities
Write-Host "`n[3/6] Seeding Database and Demo Feeds..." -ForegroundColor Yellow
$BackendDir = Join-Path $WorkspaceRoot "bavis-backend"
$env:PYTHONPATH = $WorkspaceRoot + ";" + $BackendDir
$SeedScript = Join-Path $BackendDir "scripts\seed_data.py"
& "$VenvPython" "$SeedScript"

# 4. Start AI Vision Engine (Port 8000)
Write-Host "`n[4/6] Starting AI Vision Engine (Port 8000)..." -ForegroundColor Yellow
Start-Process -FilePath "$VenvPython" -ArgumentList "-m uvicorn ai_engine.server:app --host 0.0.0.0 --port 8000" -WorkingDirectory $WorkspaceRoot -PassThru

# 5. Start Event Intelligence Engine (Port 8003)
Write-Host "`n[5/6] Starting Event Intelligence Engine (Port 8003)..." -ForegroundColor Yellow
$IntelDir = Join-Path $WorkspaceRoot "bavis-infra\intelligence"
Start-Process -FilePath "$VenvPython" -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8003" -WorkingDirectory $IntelDir -PassThru

# 6. Start Backend Gateway API (Port 8001) & Frontend (Port 5173)
Write-Host "`n[6/6] Starting Backend Gateway (Port 8001) and Frontend Dashboard (Port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "$VenvPython" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8001" -WorkingDirectory $BackendDir -PassThru

$FrontendDir = Join-Path $WorkspaceRoot "bavis-frontend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $FrontendDir -PassThru

Start-Sleep -Seconds 4

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   BAVIS Multi-Service System Online and Operational!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   * Frontend Dashboard:  http://localhost:5173" -ForegroundColor White
Write-Host "   * Backend API Gateway: http://localhost:8001/docs" -ForegroundColor White
Write-Host "   * AI Vision Engine:    http://localhost:8000/docs" -ForegroundColor White
Write-Host "   * Intelligence Engine: http://localhost:8003/health" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
