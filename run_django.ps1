$ErrorActionPreference = "Stop"
$env:DJANGO_SETTINGS_MODULE = "config.settings"
$env:PYTHONPATH = "C:\Users\N Sai Kiran\OneDrive\Desktop\civic\backend"

Set-Location "C:\Users\N Sai Kiran\OneDrive\Desktop\civic\backend"
python manage.py runserver 8000