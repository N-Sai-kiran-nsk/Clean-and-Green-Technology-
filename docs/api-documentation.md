# API Documentation

## Base URL
`http://localhost:8000/api`

## Authentication
All endpoints except registration and login require a valid JWT access token in the header:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Authentication responses return both:
- `access` - short-lived JWT used for API requests
- `refresh` - JWT used to obtain a new access token when the current one expires

---

## Authentication Endpoints

### Register User
**POST** `/auth/register/`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "username"
}
```

**Response (201 Created):**
```json
{
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>",
  "user": {
    "id": 1,
    "username": "username",
    "email": "user@example.com",
    "first_name": "",
    "last_name": "",
    "phone_number": null,
    "profile_picture": null,
    "is_department_staff": false
  }
}
```

### Login
**POST** `/auth/login/`

Authenticate and get JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>",
  "user": {
    "id": 1,
    "username": "username",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890",
    "profile_picture": null,
    "is_department_staff": false
  }
}
```

### Get Profile
**GET** `/auth/profile/`

Get current user's profile.

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "username",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "is_department_staff": false
}
```

### Update Profile
**PUT** `/auth/profile/update/`

Update current user's profile.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890"
}
```

**Response (200 OK):**
Same as Get Profile

---

## Issue Endpoints

### List Issues
**GET** `/issues/`

Get issues visible to the current user with pagination, filtering, search, ordering, and optional geo-bounded querying.

**Visibility rules:**
- Citizens only see issues they reported
- Department staff see issues in their department, assigned to them, or reported by them
- Admin/staff users see all issues

**Query Parameters:**
- `status` - Filter by status (`open`, `in_progress`, `resolved`, `closed`)
- `priority` - Filter by priority (`low`, `medium`, `high`, `critical`)
- `category` - Case-insensitive category filter
- `department` - Filter by department ID
- `reported_by` - Filter by reporting user ID
- `assigned_to` - Filter by assigned user ID
- `has_coordinates=true|false` - Include only issues with or without latitude/longitude
- `created_after=YYYY-MM-DD` - Include issues created on/after a date
- `created_before=YYYY-MM-DD` - Include issues created on/before a date
- `search` - Full-text style search across title, description, category, and location
- `ordering` - Order by `created_at`, `updated_at`, `resolved_at`, `priority`, or `status`
- `page` - Page number for paginated results
- `latitude`, `longitude`, `radius_km` - Bounding-box geo filter around a point

**Examples:**
- `/issues/?status=open&priority=high`
- `/issues/?search=streetlight&ordering=-created_at`
- `/issues/?has_coordinates=true&latitude=12.9716&longitude=77.5946&radius_km=2`

**Response (200 OK):**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Broken Road",
      "description": "The main road is damaged",
      "status": "open",
      "priority": "high",
      "category": "Infrastructure",
      "location": "123 Main St",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "reported_by": {
        "id": 1,
        "username": "user1",
        "email": "user1@example.com"
      },
      "created_at": "2024-04-21T10:30:00Z",
      "updated_at": "2024-04-21T12:00:00Z"
    }
  ]
}
```

### Create Issue
**POST** `/issues/`

Create a new issue. The authenticated user is automatically stored as `reported_by`.

**Request Body:**
```json
{
  "title": "Broken Road",
  "description": "The main road is damaged",
  "priority": "high",
  "category": "Infrastructure",
  "location": "123 Main St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "department": 1
}
```

**Response (201 Created):**
Same format as single issue above

### Get Issue Details
**GET** `/issues/{id}/`

Get details of a specific issue including comments and attachments.

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Broken Road",
  "description": "The main road is damaged",
  "status": "open",
  "priority": "high",
  "category": "Infrastructure",
  "location": "123 Main St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "reported_by": {...},
  "assigned_to": {...},
  "department": {...},
  "created_at": "2024-04-21T10:30:00Z",
  "comments": [
    {
      "id": 1,
      "author": {...},
      "text": "We will look into this",
      "created_at": "2024-04-21T11:00:00Z"
    }
  ],
  "attachments": [
    {
      "id": 1,
      "file": "/media/issue_attachments/photo.jpg",
      "uploaded_at": "2024-04-21T10:30:00Z"
    }
  ]
}
```

### Update Issue
**PUT/PATCH** `/issues/{id}/`

Update an issue.

**Permissions:**
- Citizens may update only their own issues
- Department staff may update issues in their department or assigned to them
- Admin/staff users may update any issue

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "medium"
}
```

**Response (200 OK):**
Same as Get Issue Details

### Delete Issue
**DELETE** `/issues/{id}/`

Delete an issue using the same permission rules as update.

**Response (204 No Content):**
Empty response

### Update Issue Status
**POST** `/issues/{id}/update_status/`

Update the status of an issue.

**Permissions:**
- Citizens cannot update status
- Department staff may update status for issues in their department or assigned to them
- Admin/staff users may update any issue

When status is set to `resolved`, the backend automatically sets `resolved_at`.

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Response (200 OK):**
Updated issue object

### Add Comment
**POST** `/issues/{id}/add_comment/`

Add a comment to an issue.

**Request Body:**
```json
{
  "text": "This is a comment"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "issue": 1,
  "author": {
    "id": 1,
    "username": "username",
    "email": "user@example.com"
  },
  "text": "This is a comment",
  "created_at": "2024-04-21T10:30:00Z"
}
```

---

## Department Endpoints

### List Departments
**GET** `/departments/`

Get all active departments.

**Response (200 OK):**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Public Works",
      "email": "publicworks@city.gov",
      "phone": "+1234567890",
      "address": "123 Government St",
      "description": "Handles infrastructure issues",
      "contact_person": "John Smith",
      "is_active": true
    }
  ]
}
```

### Get Department Details
**GET** `/departments/{id}/`

Get details of a specific department.

**Response (200 OK):**
Same format as single department above

---

## Notification Endpoints

### List Notifications
**GET** `/notifications/`

Get all notifications for the current user.

**Response (200 OK):**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "notification_type": "issue_updated",
      "title": "Issue Updated",
      "message": "Your issue has been updated",
      "is_read": false,
      "created_at": "2024-04-21T10:30:00Z"
    }
  ]
}
```

### Get Unread Notifications
**GET** `/notifications/unread/`

Get only unread notifications.

**Response (200 OK):**
Same format as list above, filtered to unread only

### Mark as Read
**POST** `/notifications/{id}/mark_as_read/`

Mark a notification as read.

**Response (200 OK):**
Updated notification object with `is_read: true`

### Mark All as Read
**POST** `/notifications/mark_all_as_read/`

Mark all notifications as read.

**Response (200 OK):**
```json
{
  "status": "All notifications marked as read"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": {
    "field_name": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Status Codes Reference

- **200 OK** - Request successful
- **201 Created** - Resource created
- **204 No Content** - Resource deleted
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Server Error** - Internal error

---

## Pagination

List endpoints use DRF page-number pagination by default.

Example paginated response:
```json
{
  "count": 10,
  "next": "http://localhost:8000/api/issues/?page=2",
  "previous": null,
  "results": []
}
```

## Rate Limiting

Rate limiting may be added separately at the deployment or DRF settings layer. This document does not currently define active rate-limit values for this repository state.
