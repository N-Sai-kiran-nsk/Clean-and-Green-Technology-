@echo off
echo ========================================================
echo Starting Civic Issue Reporting System (Backend + Frontend)
echo ========================================================

echo.
echo [1/2] Starting Django Backend...
start "Django Backend" cmd /k "cd backend && python manage.py runserver"

echo [2/2] Starting Angular Frontend...
start "Angular Frontend" cmd /k "cd frontend && ng serve"

echo.
echo ========================================================
echo Servers are starting in separate windows!
echo.
echo Frontend: http://localhost:4200
echo Backend:  http://localhost:8000
echo.
echo To stop the servers, just close the new command prompt windows that popped up.
echo ========================================================
pause
