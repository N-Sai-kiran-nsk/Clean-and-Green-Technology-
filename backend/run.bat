@echo off
cd /d "%~dp0"
set DJANGO_SETTINGS_MODULE=config.settings
set PYTHONPATH=%CD%
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); from django.core.management import execute_from_command_line; import sys; sys.argv = ['manage.py', 'runserver', '8000', '--noreload']; execute_from_command_line(sys.argv)"