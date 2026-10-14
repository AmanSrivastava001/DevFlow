@echo off
cd /d "%~dp0backend"
echo.
echo Starting DevFlow Java backend on http://localhost:8080
if not exist pom.xml (echo ERROR: backend/pom.xml not found & pause & exit /b 1)
mvn spring-boot:run
if errorlevel 1 echo ERROR: Java 21 and Maven 3.9+ must be installed and on PATH.
pause
