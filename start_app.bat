@echo off
echo Starting Agri-Predict Application...

:: Start Backend
start "Agri-Predict Backend" cmd /k "cd backend && python main.py"

:: Start Frontend
start "Agri-Predict Frontend" cmd /k "cd frontend && npm run dev"

echo Application started! 
echo Backend running on http://localhost:8000
echo Frontend running on http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause >nul
