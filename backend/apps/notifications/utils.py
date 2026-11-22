"""
WebSocket utility functions for sending real-time notifications and updates.
"""

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


def _safe_group_send(group_name, payload):
    """
    Best-effort group send.

    Real-time delivery should not break normal API writes when the channel layer
    backend (for example Redis) is unavailable in local or test environments.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        async_to_sync(channel_layer.group_send)(group_name, payload)
    except Exception as exc:
        logger.warning(
            "Skipping websocket broadcast to group '%s' because the channel layer is unavailable: %s",
            group_name,
            exc,
        )


def send_notification(user_id, title, message, notification_type, issue_id=None):
    """
    Persist a notification and send it to the user's notification group.

    Args:
        user_id: ID of the user to notify
        title: Notification title
        message: Notification message
        notification_type: Type of notification (e.g., 'issue_assigned')
        issue_id: Optional ID of related issue
    """
    from apps.notifications.models import Notification

    user_id = getattr(user_id, 'pk', user_id)
    notification = Notification.objects.create(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        related_issue_id=issue_id,
    )

    _safe_group_send(
        f'user_{user_id}_notifications',
        {
            'type': 'notification_message',
            'notification_id': notification.pk,
            'title': title,
            'message': message,
            'issue_id': issue_id,
            'created_at': notification.created_at.isoformat() if notification.created_at else None,
        }
    )
    return notification


def send_issue_update(issue_id, status, updated_by=None):
    """
    Send an issue status update to all connected clients.

    Args:
        issue_id: ID of the issue
        status: New status of the issue
        updated_by: Username of who updated the issue
    """
    group_name = f'issue_{issue_id}_updates'

    _safe_group_send(
        group_name,
        {
            'type': 'issue_status_changed',
            'issue_id': issue_id,
            'status': status,
            'updated_by': updated_by,
            'updated_at': None,  # Will be set from issue model
        }
    )


def send_comment_notification(issue_id, comment_id, comment_text, author):
    """
    Send a new comment notification via WebSocket.

    Args:
        issue_id: ID of the issue
        comment_id: ID of the comment
        comment_text: Text of the comment
        author: Username of the comment author
    """
    group_name = f'issue_{issue_id}_updates'

    _safe_group_send(
        group_name,
        {
            'type': 'issue_comment_added',
            'issue_id': issue_id,
            'comment_id': comment_id,
            'comment_text': comment_text,
            'author': author,
            'created_at': None,  # Will be set from comment model
        }
    )


def broadcast_issue_update(issue_id, status, updated_by=None):
    """
    Broadcast an issue update to all interested parties.
    Sends to both the specific issue group and the general issues group.

    Args:
        issue_id: ID of the issue
        status: New status of the issue
        updated_by: Username of who updated the issue
    """
    send_issue_update(issue_id, status, updated_by)

    # Also send to general issues updates group
    _safe_group_send(
        'issues_updates',
        {
            'type': 'issue_status_changed',
            'issue_id': issue_id,
            'status': status,
            'updated_by': updated_by,
            'updated_at': None,
        }
    )
