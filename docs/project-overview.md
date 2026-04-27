# Project Overview

## Project Name
Civic Issue Reporting System

## Project Description
Civic Issue Reporting System is a full-stack web platform that allows citizens to report public issues such as potholes, broken streetlights, drainage problems, and sanitation complaints. The system is designed to route issues to the appropriate department, provide status tracking, support staff collaboration, and notify users about progress in real time.

## Current Implementation Status

The repository is beyond a blank scaffold and already contains:

- a Django backend project under `backend/`
- an Angular frontend under `frontend/`
- Docker Compose orchestration for PostgreSQL, Redis, backend, and frontend
- core backend apps for users, issues, departments, and notifications
- Angular feature modules for auth, dashboard, issues, and admin
- initial database and architecture documentation

Phase 1 should therefore be treated as **scaffold alignment and documentation hardening**, not first-time project creation from scratch.

## Objectives

1. **Empower Citizens**  
   Make it easy for people to report issues in their locality.

2. **Improve Government Response**  
   Help departments receive, triage, assign, and resolve issues faster.

3. **Increase Transparency**  
   Allow users to track issue status and activity.

4. **Support Collaboration**  
   Enable communication between citizens, staff, and administrators.

5. **Enable Future Expansion**  
   Provide a clean foundation for authentication, dashboards, notifications, analytics, and real-time features.

## Core User Roles

### 1. Citizens
- Register and log in
- Report civic issues
- Upload attachments
- Track issue status
- Receive notifications
- View or participate in issue comments

### 2. Department Staff
- View assigned or department issues
- Update issue status
- Add internal or public-facing progress comments
- Coordinate issue handling

### 3. Administrators
- Manage departments and users
- Oversee issue workflows
- Review system activity and platform usage
- Configure operational settings over time

## Current Tech Stack

### Backend
- **Framework**: Django 5.0
- **API Layer**: Django REST Framework
- **Real-Time Layer**: Django Channels
- **ASGI Server**: Daphne
- **Database**: PostgreSQL by default, SQLite fallback for lightweight local use
- **Cache / Messaging**: Redis
- **Configuration**: `python-decouple`

### Frontend
- **Framework**: Angular 17
- **Language**: TypeScript
- **Routing**: Angular Router
- **HTTP**: Angular HttpClient
- **Styling**: Bootstrap 5 and global CSS

### Infrastructure
- **Container Orchestration**: Docker Compose
- **Database Container**: PostgreSQL 15
- **Redis Container**: Redis 7
- **Development Workflow**: Docker-first, with optional local non-Docker setup

## Current Project Structure

```text
civic-issue-reporting-system/
├── backend/
│   ├── apps/
│   │   ├── departments/
│   │   ├── issues/
│   │   ├── notifications/
│   │   └── users/
│   ├── config/
│   ├── manage.py
│   ├── requirements.txt
│   ├── media/
│   └── static/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── modules/
│   │   │   └── shared/
│   │   └── assets/
│   ├── angular.json
│   └── package.json
├── database/
│   └── schema.sql
├── docs/
│   ├── api-documentation.md
│   ├── architecture.md
│   ├── phase3-websockets.md
│   └── project-overview.md
├── docker-compose.yml
└── README.md
```

## Phase 1 Naming Reconciliation

The original implementation plan referenced these Django base apps:

- `accounts`
- `issues`
- `comments`
- `notifications`
- `admin_panel`

The current repository already implements the same responsibilities with slightly different structure:

- Planned `accounts` is currently implemented as `backend/apps/users`
- Planned `comments` is currently implemented inside `backend/apps/issues/models.py` as `IssueComment`
- Planned `admin_panel` is currently covered by Django admin plus Angular admin modules
- `issues` and `notifications` already exist as standalone apps

This is an important architectural note: the repository is already functional enough that forcing duplicate Django apps purely for naming parity would create confusion and unnecessary technical debt. The current structure is acceptable for Phase 1 as long as documentation clearly maps the planned names to the implemented modules.

## Backend Scope Already Scaffolded

### Users
Current authentication-related scaffolding exists in `backend/apps/users/`:
- custom user model
- registration endpoint
- login endpoint
- profile retrieval
- profile update

### Issues
Current issue-management scaffolding exists in `backend/apps/issues/`:
- issue model
- issue attachments
- embedded issue comments
- serializers/views/tests scaffolding
- real-time consumer placeholder

### Departments
Department support exists in `backend/apps/departments/`:
- department model
- serializer and view scaffolding
- issue-to-department relationship

### Notifications
Notification support exists in `backend/apps/notifications/`:
- notification model
- serializer and view scaffolding
- websocket-related scaffolding

## Frontend Scope Already Scaffolded

The Angular app already contains a modular structure with lazy-loaded areas for:

- `auth`
- `dashboard`
- `issues`
- `admin`

Supporting frontend infrastructure already exists for:
- auth guard
- admin guard
- auth interceptor
- API service structure
- shared UI layout areas

## Environment and Configuration Direction

The project has now been aligned to use environment-driven settings:

- PostgreSQL is the default Django database backend
- Redis host and port are read from environment variables
- Docker Compose service names can be used directly from the backend container
- SQLite remains available as a fallback for lightweight local development

This matches the current `docker-compose.yml` more closely than the earlier mixed SQLite-first documentation.

## Development Workflow

### Preferred: Docker Compose
Run the full stack with:

```bash
docker-compose up --build
```

Expected services:
- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Optional: Local Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Optional: Local Frontend
```bash
cd frontend
npm install
npm start
```

## Architectural Priorities by Phase

### Phase 1: Scaffold and Setup Alignment
Focus:
- align environment configuration with Docker Compose
- ensure dependencies support PostgreSQL
- document the actual project structure
- reconcile planned app names with implemented modules

### Phase 2: Database and Backend Core
Focus:
- refine schema and model relationships
- strengthen serializers and view logic
- move toward JWT-based authentication
- improve CRUD coverage and permissions

### Phase 3: Real-Time and Advanced Backend
Focus:
- complete Channels routing
- add Redis-backed real-time notifications
- add issue update subscriptions
- improve pagination, filtering, and geolocation handling

### Phase 4: Frontend Core and State
Focus:
- harden auth flow
- expand route-level UX
- improve layout and module consistency
- connect services to the API more comprehensively

### Phase 5: Frontend Features
Focus:
- issue reporting UX
- citizen dashboard
- admin dashboard
- websocket-based live updates

### Phase 6: Polish and Deployment
Focus:
- unit and integration tests
- production Docker improvements
- deployment documentation
- API documentation finalization

## Current Risks / Gaps Identified

1. **Auth mismatch with roadmap**  
   Documentation previously mentioned DRF token auth while the roadmap expects SimpleJWT later.

2. **Comments not separated as their own app**  
   Comments currently live inside `issues`, which is acceptable short term but should be kept in mind if comment complexity grows.

3. **Admin backend app not separated yet**  
   Admin functionality is represented more in routing/UI structure than as a dedicated backend Django app.

4. **Environment drift existed before alignment**  
   Docker used PostgreSQL/Redis while Django settings previously defaulted to SQLite and `127.0.0.1` Redis. This has now been corrected at the config level.

## Success Criteria for the Current Foundation

The foundation is considered healthy when:

- Docker Compose can support the intended local stack
- Django can read PostgreSQL and Redis configuration from environment variables
- backend dependencies support PostgreSQL
- documentation reflects the actual repository structure
- future phases can be implemented without renaming confusion

## Documentation References

Additional documentation:
- `README.md`
- `docs/architecture.md`
- `docs/api-documentation.md`
- `docs/phase3-websockets.md`

## Summary

This project is no longer at zero setup. The current work is about turning an already-started civic reporting platform into a coherent, documented, Docker-aligned foundation so that the later implementation phases can proceed cleanly and predictably.
