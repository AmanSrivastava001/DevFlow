@echo off
cd /d "%~dp0frontend"
echo.
echo Starting DevFlow React frontend on http://localhost:5173
if not exist node_modules (npm install)
if errorlevel 1 (echo ERROR: npm install failed. Check Node.js and internet connection. & pause & exit /b 1)
npm run dev
pause
