import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from apps.notifications.models import Notification


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications."""

    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        self.user_id = self.user.id
        self.group_name = f'user_{self.user_id}_notifications'

        # Join user notification group
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

            if action == 'mark_as_read':
                notification_id = data.get('notification_id')
                await self.mark_notification_as_read(notification_id)
                await self.send(json.dumps({
                    'type': 'notification_read',
                    'notification_id': notification_id,
                }))
            elif action == 'get_unread':
                unread_count = await self.get_unread_count()
                await self.send(json.dumps({
                    'type': 'unread_count',
                    'count': unread_count,
                }))
        except json.JSONDecodeError:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Invalid JSON',
            }))

    async def notification_message(self, event):
        """Send notification to WebSocket."""
        await self.send(json.dumps({
            'type': 'notification',
            'id': event['notification_id'],
            'title': event['title'],
            'message': event['message'],
            'issue_id': event.get('issue_id'),
            'created_at': event.get('created_at'),
        }))

    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Mark notification as read in database."""
        try:
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.is_read = True
            notification.save()
        except Notification.DoesNotExist:
            pass

    @database_sync_to_async
    def get_unread_count(self):
        """Get count of unread notifications."""
        return Notification.objects.filter(
            user=self.user,
            is_read=False
        ).count()
