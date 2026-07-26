@echo off
echo ===================================================
echo   CivicPortal - Building ^& Launching Application
echo ===================================================

echo [1/3] Building Angular Frontend...
cd frontend
call npm install
call npm run build -- --configuration production
cd ..

echo.
echo [2/3] Running Django Database Migrations ^& Collecting Static Files...
cd backend
call python manage.py migrate
call python manage.py collectstatic --noinput

echo.
echo [3/3] Starting Unified Daphne Production Web Server on http://localhost:8000 ...
call daphne -b 0.0.0.0 -p 8000 config.asgi:application
