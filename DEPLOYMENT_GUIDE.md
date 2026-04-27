# Civic Issue Reporting System: Traditional Deployment Guide

This guide outlines the steps to deploy the application on a standard Linux server (e.g., Ubuntu 22.04 LTS) without using Docker, keeping infrastructure costs low by utilizing a single Virtual Private Server (VPS).

## 1. Initial Server Setup

SSH into your server and update the package lists:

```bash
sudo apt update && sudo apt upgrade -y
```

Install the required system dependencies:

```bash
sudo apt install -y python3-pip python3-venv python3-dev libpq-dev postgresql postgresql-contrib nginx curl redis-server
```

Install Node.js (for building the Angular frontend):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Database Configuration

Switch to the PostgreSQL user and open the interactive terminal:

```bash
sudo -i -u postgres
psql
```

Create the database and user (replace `strong_password` with a secure password):

```sql
CREATE DATABASE civic_db;
CREATE USER civic_user WITH PASSWORD 'strong_password';
ALTER ROLE civic_user SET client_encoding TO 'utf8';
ALTER ROLE civic_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE civic_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE civic_db TO civic_user;
\q
exit
```

## 3. Backend Deployment (Django + Daphne)

### 3.1 Setup Environment

Clone your repository to the server (e.g., in `/var/www/civic`):

```bash
sudo mkdir -p /var/www/civic
sudo chown $USER:$USER /var/www/civic
# git clone <your-repo-url> /var/www/civic
```

Create a virtual environment and install dependencies:

```bash
cd /var/www/civic/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3.2 Configure `.env`

Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=generate_a_very_secure_random_string_here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,your_server_ip

DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=civic_db
DATABASE_USER=civic_user
DATABASE_PASSWORD=strong_password
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

CORS_ALLOW_ALL_ORIGINS=True
# Or for stricter security: CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 3.3 Prepare the Database and Static Files

Run migrations and collect static files:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 3.4 Create Systemd Service for Daphne

Since the app uses Django Channels (WebSockets), we must use an ASGI server like Daphne.

```bash
sudo nano /etc/systemd/system/civic-backend.service
```

Paste the following configuration (adjust paths and users as needed):

```ini
[Unit]
Description=Daphne daemon for Civic Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/civic/backend
Environment="PATH=/var/www/civic/backend/venv/bin"
ExecStart=/var/www/civic/backend/venv/bin/daphne -b 127.0.0.1 -p 8000 config.asgi:application

[Install]
WantedBy=multi-user.target
```

Start and enable the service:

```bash
sudo systemctl start civic-backend
sudo systemctl enable civic-backend
```

## 4. Frontend Deployment (Angular)

Navigate to the frontend directory, install dependencies, and build the production bundle:

```bash
cd /var/www/civic/frontend
npm ci
npm run build --configuration production
```

The compiled files will be in `/var/www/civic/frontend/dist/civic-issue-reporting/browser`.

*Note: Ensure your `src/environments/environment.prod.ts` points to your production API URL (e.g., `apiUrl: '/api'`).*

## 5. Web Server Configuration (Nginx)

Configure Nginx to serve the Angular application and reverse-proxy API/WebSocket requests to Daphne.

```bash
sudo nano /etc/nginx/sites-available/civic
```

Paste the following configuration (replace `yourdomain.com` with your actual domain or IP):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 1. Serve Angular Frontend
    root /var/www/civic/frontend/dist/civic-issue-reporting/browser;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Proxy REST API to Django/Daphne
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_addrs;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. Proxy WebSockets to Django/Daphne
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 4. Serve Django Admin Static Files
    location /static/ {
        alias /var/www/civic/backend/static/;
    }

    # 5. Serve User Uploaded Media Files
    location /media/ {
        alias /var/www/civic/backend/media/;
    }
}
```

Enable the configuration and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/civic /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Secure with SSL (Let's Encrypt)

If you are using a custom domain, secure it with a free SSL certificate:

```bash
sudo apt install -y python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically update your Nginx configuration to force HTTPS and renew the certificates automatically.
