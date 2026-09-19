@echo off
echo Starting FastAPI Backend...
cd %~dp0\backend
call venv\Scripts\activate.bat
uvicorn main:app --reload --host 0.0.0.0 --port 8000
