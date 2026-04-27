# Civic Issue Reporting System

A full-stack civic issue reporting platform for citizens, department staff, and administrators. Citizens can report public issues, track status updates, receive notifications, and communicate with departments through a centralized web application.

## Tech Stack

### Backend
- **Django 5.0**
- **Django REST Framework**
- **Django Channels** (with InMemoryChannelLayer for local dev)
- **SQLite** (Local) / **PostgreSQL** (Production)

### Frontend
- **Angular 17**
- **Bootstrap 5** (with Bootstrap Icons)
- **DM Sans** font

### Deployment
- **Render.com** (via `render.yaml`)

---

## Quick Start (Local Development)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python create_admin.py
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Start the Application

**On Windows:**
Simply double-click the `start.bat` file in the root directory, or run:
```powershell
.\start.bat
```

**On Mac/Linux:**
Terminal 1 (Backend):
```bash
cd backend && python manage.py runserver
```
Terminal 2 (Frontend):
```bash
cd frontend && npm start
```

The application will be available at `http://localhost:4200`

---

## Default Credentials

### Superadmin (pre-created):
- **Email:** admin@civic.local
- **Password:** adminpassword

### Test Users:
Register new users via the registration page at `/auth/register`

---

## Global Deployment (Render.com)

The project includes a `render.yaml` Blueprint for zero-configuration global deployment.

1. Push this repository to GitHub.
2. Sign up on [Render.com](https://render.com/).
3. Create a **New Blueprint** and link your repository.
4. Render will automatically build and host the Django Backend and Angular Frontend for free!

*(Note: Once deployed, make sure to update your Angular API configuration in `frontend/src/app/core/services` to point to the new global Render Backend URL).*

---

## Traditional VPS Deployment (Without Docker)

For cost-effective deployment on a traditional Linux VPS (e.g., DigitalOcean, AWS EC2, Linode) without using Docker, refer to the included **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**. 

The guide provides step-by-step instructions for:
- Installing Python, Node.js, PostgreSQL, Redis, and Nginx on Ubuntu.
- Configuring Django with Daphne (ASGI) for WebSocket support.
- Managing services via Systemd.
- Configuring Nginx as a reverse proxy with Let's Encrypt SSL.

---

## Features

### Authentication & Authorization
- User Login and Registration using REST APIs
- JWT-based authentication
- Role-based access control (User, Staff, Admin, Superadmin)

### Dashboard
- Overview cards: Total Issues, Resolved Issues, Active Alerts, Open Issues
- Interactive charts: Incidents by Type, Incidents by Status
- Real-time notifications display
- Theme toggle (Light/Dark mode)

### Issue Reporting
- Submit issues with title, description, category, priority, location
- Optional coordinates (latitude/longitude)
- Department assignment
- Track issue status: Open → In Progress → Resolved → Closed

### Notifications
- In-app notification system
- Mark individual or all as read
- Real-time alert for new updates

### Admin Features
- **Manage Issues:** View, update status, delete issues
- **Manage Users:** Grant/remove admin privileges (superadmin only)
- **Department Management:** Add/edit departments

---

## User Roles

| Role | Permissions |
|------|-------------|
| User | Report issues, view own issues, receive notifications |
| Staff | Update assigned department issues |
| Admin | Manage all issues, view all users |
| Superadmin | Full access including user management |

---

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/profile/` - Get current user
- `PUT /api/auth/profile/update/` - Update profile

### Issues
- `GET /api/issues/` - List all issues
- `POST /api/issues/` - Create new issue
- `GET /api/issues/{id}/` - Get issue details
- `PATCH /api/issues/{id}/` - Update issue
- `DELETE /api/issues/{id}/` - Delete issue
- `POST /api/issues/{id}/update_status/` - Update issue status
- `POST /api/issues/{id}/add_comment/` - Add comment

### Users (Admin)
- `GET /api/auth/` - List all users
- `POST /api/auth/{id}/set_admin/` - Grant admin privileges
- `POST /api/auth/{id}/remove_admin/` - Remove admin privileges
- `GET /api/auth/staff_list/` - List staff users

### Notifications
- `GET /api/notifications/` - List notifications
- `GET /api/notifications/unread/` - Get unread notifications
- `POST /api/notifications/{id}/mark_as_read/` - Mark as read
- `POST /api/notifications/mark_all_as_read/` - Mark all as read

---

## Project Structure

```
civic/
├── backend/              # Django 5 API
│   ├── apps/
│   │   ├── users/      # User authentication & management
│   │   ├── issues/     # Issue reporting system
│   │   ├── departments/ # Department management
│   │   └── notifications/ # Notification system
│   ├── config/         # Django settings
│   ├── create_admin.py # Superadmin creation script
│   └── manage.py
├── frontend/            # Angular 17 Web App
│   ├── src/
│   │   ├── app/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Login, Register
│   │   │   │   ├── dashboard/  # Main dashboard
│   │   │   │   ├── issues/    # Issue reporting
│   │   │   │   ├── admin/     # Admin panels
│   │   │   │   └── settings/  # User settings
│   │   │   └── core/
│   │   │       ├── services/   # API services
│   │   │       └── guards/    # Auth guards
│   │   └── styles.css
│   └── package.json
├── docs/                # Architecture docs
├── render.yaml          # Cloud deployment
└── start.bat           # 1-Click local runner
```

---

## Routes

| Path | Description |
|------|-------------|
| `/auth/login` | User login |
| `/auth/register` | User registration |
| `/dashboard` | Main dashboard with stats & notifications |
| `/report-issue` | Submit new issue |
| `/issues` | View all issues |
| `/issues/detail/:id` | Issue details |
| `/admin/manage-issues` | Manage issues (admin) |
| `/admin/manage-users` | Manage user privileges (superadmin) |
| `/admin/departments` | Manage departments (admin) |
| `/settings` | User settings |

---

## License

MIT"# Clean-and-Green-Technology-" 
