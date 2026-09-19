@echo off
setlocal
cd /d "%~dp0"

REM If running from project root, move into backend directory
if exist "backend\main.py" (
    cd backend
)

echo [QuantLens Backend] Preparing environment...

REM Find Python executable (prefer py launcher on Windows)
where py >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set PY_CMD=py
) else (
    set PY_CMD=python
)

REM Create virtual environment if it doesn't exist
if not exist "venv\Scripts\activate.bat" (
    echo [QuantLens Backend] Creating Python virtual environment in backend\venv...
    %PY_CMD% -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo [QuantLens Backend] Error: Failed to create virtual environment. Ensure Python is installed.
        pause
        exit /b 1
    )
    echo [QuantLens Backend] Installing dependencies from requirements.txt...
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo [QuantLens Backend] Starting FastAPI server on http://localhost:8000...
uvicorn main:app --reload --host 0.0.0.0 --port 8000
