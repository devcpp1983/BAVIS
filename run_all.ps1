# BAVIS — Single-Laptop Automated Run Script (PowerShell)
# Launches database seeding, AI Vision Engine, Intelligence Engine, Backend Gateway, and Frontend Dashboard

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   BAVIS -- Border AI Video Intelligence System" -ForegroundColor Cyan
Write-Host "   Single-Laptop Multi-Service Orchestrator" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Initialize SQLite Database and Seed Data
Write-Host ""
Write-Host "[1/5] Seeding SQLite Database and Demo Entities..." -ForegroundColor Yellow
$backendPath = Join-Path $WorkspaceRoot "bavis-backend"
$env:PYTHONPATH = $WorkspaceRoot + ";" + $backendPath
$seedScript = Join-Path $backendPath "scripts\seed_data.py"
python $seedScript

# 2. Launch AI Vision Engine (Port 8000)
Write-Host ""
Write-Host "[2/5] Starting AI Vision Engine (Port 8000)..." -ForegroundColor Yellow
$aiProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn ai_engine.server:app --host 0.0.0.0 --port 8000" -WorkingDirectory $WorkspaceRoot -PassThru

# 3. Launch Intelligence Engine (Port 8003)
Write-Host ""
Write-Host "[3/5] Starting Event Intelligence Engine (Port 8003)..." -ForegroundColor Yellow
$intelDir = Join-Path $WorkspaceRoot "bavis-infra\intelligence"
$intelProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8003" -WorkingDirectory $intelDir -PassThru

# 4. Launch Backend API Gateway (Port 8001)
Write-Host ""
Write-Host "[4/5] Starting Backend Gateway API (Port 8001)..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8001" -WorkingDirectory $backendPath -PassThru

# 5. Launch Frontend Dashboard (Port 5173)
Write-Host ""
Write-Host "[5/5] Starting Frontend Operator Dashboard (Port 5173)..." -ForegroundColor Yellow
$frontendDir = Join-Path $WorkspaceRoot "bavis-frontend"
$frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $frontendDir -PassThru

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   BAVIS Multi-Service Stack Online and Operational!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   * Frontend Dashboard:  http://localhost:5173" -ForegroundColor White
Write-Host "   * Backend API Gateway: http://localhost:8001/docs" -ForegroundColor White
Write-Host "   * AI Vision Engine:    http://localhost:8000/docs" -ForegroundColor White
Write-Host "   * Intelligence Engine: http://localhost:8003/health" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
