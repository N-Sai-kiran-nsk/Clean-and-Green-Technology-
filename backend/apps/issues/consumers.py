import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from apps.issues.models import Issue


class IssueUpdateConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time issue status updates."""

    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope['user']
        self.issue_id = self.scope['url_route']['kwargs'].get('issue_id')

        if not self.user.is_authenticated:
            await self.close()
            return

        # Check if user has permission to view this issue
        if self.issue_id:
            has_permission = await self.check_issue_permission()
            if not has_permission:
                await self.close()
                return

            self.group_name = f'issue_{self.issue_id}_updates'
        else:
            # Only privileged users should receive the global issues stream.
            if not await self.can_view_global_updates():
                await self.close()
                return

            self.group_name = 'issues_updates'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnect."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Receive message from WebSocket."""
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'subscribe_issue':
                issue_id = data.get('issue_id')
                # Verify permission before subscribing
                if await self.can_view_issue(issue_id):
                    self.issue_id = issue_id
                    self.group_name = f'issue_{issue_id}_updates'
                    await self.channel_layer.group_add(
                        self.group_name,
                        self.channel_name
                    )
                    await self.send(json.dumps({
                        'type': 'subscribed',
                        'issue_id': issue_id,
                    }))
        except json.JSONDecodeError:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Invalid JSON',
            }))

    async def issue_status_changed(self, event):
        """Send issue status update to WebSocket."""
        await self.send(json.dumps({
            'type': 'issue_update',
            'issue_id': event['issue_id'],
            'status': event['status'],
            'updated_by': event.get('updated_by'),
            'updated_at': event.get('updated_at'),
        }))

    async def issue_comment_added(self, event):
        """Send issue comment notification to WebSocket."""
        await self.send(json.dumps({
            'type': 'comment_added',
            'issue_id': event['issue_id'],
            'comment_id': event['comment_id'],
            'comment_text': event['comment_text'],
            'author': event.get('author'),
            'created_at': event.get('created_at'),
        }))

    @database_sync_to_async
    def check_issue_permission(self):
        """Check if user can view the current issue."""
        return self._user_can_view_issue(self.issue_id)

    @database_sync_to_async
    def can_view_issue(self, issue_id):
        """Check if user can view a specific issue."""
        return self._user_can_view_issue(issue_id)

    @database_sync_to_async
    def can_view_global_updates(self):
        """Only staff roles can subscribe to the global issues stream."""
        return (
            self.user.is_superuser or
            self.user.is_staff or
            getattr(self.user, 'is_department_staff', False)
        )

    def _user_can_view_issue(self, issue_id):
        try:
            issue = Issue.objects.get(id=issue_id)

            if self.user.is_superuser or self.user.is_staff:
                return True

            if getattr(self.user, 'is_department_staff', False):
                return (
                    issue.department_id == self.user.department_id or
                    issue.assigned_to_id == self.user.id or
                    issue.reported_by_id == self.user.id
                )

            return issue.reported_by_id == self.user.id
        except Issue.DoesNotExist:
            return False
