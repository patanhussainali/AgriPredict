@echo off
echo ===================================================
echo       Starting Agri-Predict AI System 🚀
echo ===================================================
echo.

:: 1. Start Backend Server (Port 8000)
echo [1/3] Launching AI Backend Server...
start "Agri-Predict Backend" cmd /k "cd backend && python main.py"

:: 2. Start Frontend Server (Port 5173)
echo [2/3] Launching Frontend Interface...
start "Agri-Predict Frontend" cmd /k "cd frontend && npm run dev"

:: 3. Open Browser
echo [3/3] Opening Web Browser...
timeout /t 5 >nul
start http://localhost:3000

echo.
echo ===================================================
echo       System Started Successfully! ✅
echo ===================================================
echo.
echo Two new windows have opened. Please do not close them.
echo You can minimize them to keep the server running.
echo.
pause
