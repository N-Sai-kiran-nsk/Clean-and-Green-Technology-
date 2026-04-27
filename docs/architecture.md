# Architecture Overview

## System Architecture

The Civic Issue Reporting System follows a modern web application architecture with a clear separation between frontend and backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Angular)                │
│  - User Interface Components                        │
│  - State Management                                 │
│  - HTTP Interceptors (Auth)                         │
│  - Services (Auth, Issues, Notifications)           │
└──────────────────┬──────────────────────────────────┘
                   │
              HTTP/HTTPS
                   │
┌──────────────────▼──────────────────────────────────┐
│         Backend (Django REST API)                   │
│  - REST Endpoints                                   │
│  - Authentication & Authorization                   │
│  - Business Logic                                   │
│  - Database ORM                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ SQL
                   │
┌──────────────────▼──────────────────────────────────┐
│      Database (SQLite / PostgreSQL)                 │
│  - Users, Issues, Departments                       │
│  - Notifications, Comments, Attachments            │
└──────────────────────────────────────────────────────┘
```

## Backend Architecture

### Layered Architecture

1. **Views/APIs Layer**
   - REST endpoints
   - Request/response handling
   - ViewSets for CRUD operations

2. **Serializers Layer**
   - Data validation
   - Serialization/Deserialization
   - Business logic validation

3. **Models Layer**
   - Database models
   - Relationships
   - Database constraints

4. **Services Layer**
   - Business logic
   - External integrations
   - Complex operations

### Apps Structure

#### Users App
- User registration and authentication
- Profile management
- Token-based authentication

#### Issues App
- Issue creation and management
- Issue status tracking
- Comments and attachments
- Issue filtering and search

#### Departments App
- Department management
- Department-issue relationships
- Staff management

#### Notifications App
- Notification creation
- User notifications
- Read/unread status

## Frontend Architecture

### Module Structure

1. **Core Module**
   - Services (Auth, Issue, Notification)
   - Interceptors (Auth)
   - Guards (Route protection)

2. **Shared Module**
   - Reusable components
   - Navbar, Footer, Common UI

3. **Feature Modules**
   - Auth Module (Login, Register)
   - Dashboard Module
   - Issues Module (Report, List, Detail)
   - Admin Module

### Data Flow

```
User Action
    ↓
Component
    ↓
Service (HTTP Call)
    ↓
Interceptor (Add Auth Token)
    ↓
Backend API
    ↓
Response
    ↓
Store in Local Storage / State
    ↓
Update Component
    ↓
UI Update
```

## Authentication Flow

1. User registers with email and password
2. Backend creates user and auth token
3. Frontend stores token in localStorage
4. Interceptor adds token to all API requests
5. Backend validates token on each request
6. On logout, token is removed from storage

## API Communication

### Request Format
```
Authorization: Token <auth_token>
Content-Type: application/json
```

### Response Format
```json
{
  "data": {},
  "message": "Success"
}
```

## Database Design

### Key Entities

1. **User**
   - Authentication credentials
   - Profile information
   - Department association (for staff)

2. **Issue**
   - Issue details and status
   - Location information
   - Reporter and assignee
   - Department assignment

3. **Department**
   - Department information
   - Contact details
   - Associated issues

4. **Notification**
   - User notifications
   - Issue updates
   - Read status

### Relationships

- User → Issues (One-to-Many)
- User → Departments (Many-to-One)
- Department → Issues (One-to-Many)
- Issue → Comments (One-to-Many)
- Issue → Attachments (One-to-Many)

## Security Considerations

1. **Authentication**
   - Token-based (JWT alternative available)
   - Secure password hashing

2. **Authorization**
   - Permission classes on views
   - Role-based access control

3. **CORS**
   - Configured for development
   - Should be restricted in production

4. **Data Validation**
   - Serializer validation
   - Model constraints

## Scalability Considerations

1. **Caching**
   - Redis for token caching
   - Database query caching

2. **Database**
   - Use PostgreSQL in production
   - Index frequently queried fields

3. **API**
   - Pagination implemented
   - Rate limiting available

4. **Frontend**
   - Lazy loading modules
   - Code splitting
   - Production builds optimized

## Deployment Architecture

### Development
- Local machines with SQLite
- Django dev server
- Angular dev server

### Production
- Docker containers
- Gunicorn + Nginx (backend)
- CDN for static files
- PostgreSQL database
- Redis for caching
- S3 for media storage
