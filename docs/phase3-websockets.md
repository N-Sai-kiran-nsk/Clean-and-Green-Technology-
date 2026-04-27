# Phase 3: WebSockets & Real-Time Updates - Setup Guide

## Overview
Phase 3 implements real-time WebSocket communication for:
- **Notifications**: Real-time notifications to users about issue updates
- **Issue Updates**: Live status changes and comments on issues
- **Broadcasting**: Automatic event propagation to all connected clients

## Components Added

### 1. Backend Infrastructure
- **Django Channels**: WebSocket server framework
- **Redis**: Message broker for Channels
- **Daphne**: ASGI HTTP/WebSocket server

### 2. WebSocket Consumers
- `NotificationConsumer`: Handles user notifications
  - Location: `backend/apps/notifications/consumers.py`
  - Endpoints: `ws://localhost:8000/ws/notifications/`
  - Features: Mark as read, get unread count, real-time notifications

- `IssueUpdateConsumer`: Handles issue updates and comments
  - Location: `backend/apps/issues/consumers.py`
  - Endpoints: `ws://localhost:8000/ws/issues/`
  - Features: Subscribe to issues, receive status changes, comment notifications

### 3. Utility Functions
- `backend/apps/notifications/utils.py`: Helper functions for sending WebSocket messages
  - `send_notification()`: Send notification to specific user
  - `send_issue_update()`: Send issue status update
  - `send_comment_notification()`: Send comment notification
  - `broadcast_issue_update()`: Broadcast to all connected clients

### 4. Signal Handlers
- `backend/apps/issues/signals.py`: Django signals for automatic WebSocket events
  - Automatically sends notifications when issues are updated
  - Automatically notifies users when comments are added
  - Creates database records for notification history

### 5. Infrastructure Files
- `docker-compose.yml`: Docker setup for Redis and PostgreSQL
- Updated `requirements.txt`: Added Channels and Redis packages

## Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Python 3.8+
- Node.js 14+ (for frontend)

### Step 1: Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Start Redis and PostgreSQL
```bash
# From project root
docker-compose up -d
```

### Step 3: Run Migrations
```bash
cd backend
python manage.py migrate
```

### Step 4: Start Django Development Server (Daphne)
```bash
cd backend
# Using Daphne (recommended for development)
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# OR using Django's runserver (if you have ASGI_APPLICATION set)
python manage.py runserver
```

### Step 5: Verify Setup
Check if WebSocket server is running:
```bash
# Should show connection accepted
wscat -c ws://localhost:8000/ws/notifications/
```

## WebSocket API

### Notifications WebSocket
**URL**: `ws://localhost:8000/ws/notifications/`

**Authentication**: Required (uses Django token auth)

**Headers**:
```
Authorization: Token <your-auth-token>
```

#### Incoming Messages (Client → Server)
```json
{
  "action": "mark_as_read",
  "notification_id": 123
}
```

```json
{
  "action": "get_unread"
}
```

#### Outgoing Messages (Server → Client)
```json
{
  "type": "notification",
  "id": 123,
  "title": "Issue Assigned",
  "message": "You have been assigned to issue #45",
  "issue_id": 45,
  "created_at": "2026-04-22T10:30:00Z"
}
```

```json
{
  "type": "unread_count",
  "count": 5
}
```

```json
{
  "type": "notification_read",
  "notification_id": 123
}
```

### Issues WebSocket
**URL**: `ws://localhost:8000/ws/issues/`

**Authentication**: Required

**Headers**:
```
Authorization: Token <your-auth-token>
```

#### Incoming Messages (Client → Server)
```json
{
  "action": "subscribe_issue",
  "issue_id": 45
}
```

#### Outgoing Messages (Server → Client)
```json
{
  "type": "issue_update",
  "issue_id": 45,
  "status": "in_progress",
  "updated_by": "admin_user",
  "updated_at": "2026-04-22T10:30:00Z"
}
```

```json
{
  "type": "comment_added",
  "issue_id": 45,
  "comment_id": 123,
  "comment_text": "This issue is being worked on",
  "author": "john_doe",
  "created_at": "2026-04-22T10:35:00Z"
}
```

```json
{
  "type": "subscribed",
  "issue_id": 45
}
```

## Frontend Integration (Angular)

### Example WebSocket Service
```typescript
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private notificationSocket: WebSocket;
  private issueSocket: WebSocket;
  
  public notifications$ = new Subject<any>();
  public issueUpdates$ = new Subject<any>();

  constructor(private authService: AuthService) {}

  connectNotifications() {
    const token = this.authService.getToken();
    this.notificationSocket = new WebSocket(
      `ws://localhost:8000/ws/notifications/?token=${token}`
    );

    this.notificationSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.notifications$.next(message);
    };
  }

  connectIssues(issueId: number) {
    const token = this.authService.getToken();
    this.issueSocket = new WebSocket(
      `ws://localhost:8000/ws/issues/?token=${token}`
    );

    this.issueSocket.onopen = () => {
      this.issueSocket.send(JSON.stringify({
        action: 'subscribe_issue',
        issue_id: issueId
      }));
    };

    this.issueSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.issueUpdates$.next(message);
    };
  }

  disconnect() {
    if (this.notificationSocket) {
      this.notificationSocket.close();
    }
    if (this.issueSocket) {
      this.issueSocket.close();
    }
  }
}
```

## Database Models Updated

### Notification Model (Already Has `is_read` Field)
```python
class Notification(models.Model):
    user = models.ForeignKey(User, ...)
    notification_type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_issue = models.ForeignKey(Issue, ...)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

## Production Deployment Notes

1. **Use Gunicorn + Daphne** for production
2. **Use channels-redis** for multi-process support
3. **Configure Redis persistence** in docker-compose
4. **Enable SSL/TLS** for WSS (WebSocket Secure)
5. **Set up load balancer** if using multiple workers

## Troubleshooting

### WebSocket connection refused
- Check Redis is running: `docker-compose ps`
- Check Daphne is running on port 8000
- Verify ASGI_APPLICATION is set in settings

### Messages not being received
- Check authentication token is valid
- Check user has permission to view issue/resource
- Check Redis connection: `redis-cli ping`

### Memory leaks with long connections
- Implement connection timeout in consumers
- Test with many concurrent connections
- Monitor Redis memory usage

## Next Steps (Phase 4)
- Integrate WebSocket in Angular frontend
- Add real-time notification UI
- Implement connection reconnection logic
- Add WebSocket error handling
