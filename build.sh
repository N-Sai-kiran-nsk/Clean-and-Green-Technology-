#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Building Angular Frontend ---"
cd frontend
npm install
npm run build -- --configuration production
cd ..

echo "--- Preparing Django Backend ---"
cd backend
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
echo "--- Build Complete ---"
