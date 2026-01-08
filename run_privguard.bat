@echo off
echo ============================================
echo 🛡️  STARTING PRIVGUARD SECURITY SYSTEM
echo ============================================

:: Activate venv path (assumes venv exists)
set VENV_PATH=venv\Scripts\activate

:: Start Backend
echo 🚀 Starting API Gateway (Port 8000)...
start "PrivGuard Backend" cmd /k "%VENV_PATH% && uvicorn app.main:app --reload"

:: Give backend time to boot
timeout /t 3 /nobreak >nul

:: Start Frontend
echo 📊 Starting Security Dashboard (Port 8501)...
start "PrivGuard Dashboard" cmd /k "%VENV_PATH% && streamlit run frontend/app.py"

echo.
echo ✅ SYSTEM ONLINE
echo Backend Docs: http://127.0.0.1:8000/docs
echo Dashboard:    http://localhost:8501
echo.
pause
