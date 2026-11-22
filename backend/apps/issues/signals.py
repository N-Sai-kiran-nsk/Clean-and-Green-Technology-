import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.issues.models import Issue, IssueComment
from apps.notifications.utils import broadcast_issue_update, send_comment_notification, send_notification

logger = logging.getLogger(__name__)


def _notify_user(user, notification_type, title, message, issue):
    if not user:
        return
    send_notification(
        user_id=user.id,
        title=title,
        message=message,
        notification_type=notification_type,
        issue_id=issue.id,
    )


@receiver(post_save, sender=Issue)
def issue_updated_signal(sender, instance, created, **kwargs):
    if created or not getattr(instance, '_status_changed', False):
        return

    actor = getattr(instance, '_actor', None)
    actor_name = actor.username if actor else (instance.assigned_to.username if instance.assigned_to else 'Admin')

    try:
        broadcast_issue_update(
            issue_id=instance.id,
            status=instance.status,
            updated_by=actor_name,
        )
    except Exception as exc:
        logger.warning('Failed to broadcast issue update via WebSocket: %s', exc)

    recipients = []
    seen_user_ids = set()

    if instance.assigned_to and instance.assigned_to.id not in seen_user_ids:
        seen_user_ids.add(instance.assigned_to.id)
        recipients.append((
            instance.assigned_to,
            'issue_updated',
            f'Issue Updated: {instance.title}',
            f'{actor_name} changed the status of "{instance.title}" to {instance.get_status_display()}.',
        ))

    if instance.reported_by and instance.reported_by.id not in seen_user_ids:
        seen_user_ids.add(instance.reported_by.id)
        recipients.append((
            instance.reported_by,
            'issue_resolved' if instance.status == 'resolved' else 'status_changed',
            f'Issue Status Updated: {instance.title}',
            f'Your reported issue "{instance.title}" has been updated to {instance.get_status_display()} by {actor_name}.',
        ))

    for user, notification_type, title, message in recipients:
        _notify_user(user, notification_type, title, message, instance)

    emailed_addresses = set()
    for user, _notification_type, title, message in recipients:
        email = getattr(user, 'email', '')
        if not email or email in emailed_addresses:
            continue
        emailed_addresses.add(email)
        try:
            send_mail(
                subject=f'CivicPortal: {title}',
                message=f'Hello {user.get_full_name() or user.username},\n\n{message}\n\nThank you for using CivicPortal!',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception as exc:
            logger.warning('Failed to send email to %s: %s', email, exc)


@receiver(post_save, sender=IssueComment)
def comment_added_signal(sender, instance, created, **kwargs):
    if not created:
        return

    issue = instance.issue

    try:
        send_comment_notification(
            issue_id=issue.id,
            comment_id=instance.id,
            comment_text=instance.text,
            author=instance.author.username,
        )
    except Exception as exc:
        logger.warning('Failed to send comment notification via WebSocket: %s', exc)

    recipients = []
    seen_user_ids = {instance.author_id}
    for user in (issue.reported_by, issue.assigned_to):
        if not user or user.id in seen_user_ids:
            continue
        seen_user_ids.add(user.id)
        recipients.append(user)

    for user in recipients:
        _notify_user(
            user,
            'comment_added',
            f'New Comment on Issue: {issue.title}',
            f'{instance.author.username} commented: {instance.text[:100]}...',
            issue,
        )
