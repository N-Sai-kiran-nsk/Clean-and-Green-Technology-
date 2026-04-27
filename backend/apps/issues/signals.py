"""
Django signals for WebSocket notifications.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.issues.models import Issue, IssueComment
from apps.notifications.models import Notification
from apps.notifications.utils import broadcast_issue_update, send_comment_notification
from django.conf import settings
from django.core.mail import send_mail


@receiver(post_save, sender=Issue)
def issue_updated_signal(sender, instance, created, **kwargs):
    """
    Signal handler for when an issue is created or updated.
    Sends WebSocket notifications to interested parties.
    """
    if not created and getattr(instance, '_status_changed', False):
        # Broadcast status updates to all connected clients
        broadcast_issue_update(
            issue_id=instance.id,
            status=instance.status,
            updated_by=instance.assigned_to.username if instance.assigned_to else 'Admin'
        )

        # Create notification for assigned user
        if instance.assigned_to:
            Notification.objects.create(
                user=instance.assigned_to,
                notification_type='issue_updated',
                title=f'Issue Updated: {instance.title}',
                message=f'Issue status changed to {instance.get_status_display()}',
                related_issue=instance
            )
            
            # Send Email to assigned user
            try:
                send_mail(
                    subject=f"CivicPortal: Assigned Issue Update '{instance.title}'",
                    message=f"Hello {instance.assigned_to.get_full_name() or instance.assigned_to.username},\n\nThe status of the issue assigned to you ('{instance.title}') has been updated to: {instance.get_status_display()}.\n\nThank you for using CivicPortal!",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[instance.assigned_to.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Failed to send email to assigned user: {e}")

        # Notify reported_by user
        Notification.objects.create(
            user=instance.reported_by,
            notification_type='status_changed' if instance.status != 'resolved' else 'issue_resolved',
            title=f"Issue Status Updated: {instance.title}",
            message=f"Your reported issue has been updated to '{instance.get_status_display()}'.",
            related_issue=instance
        )
        
        # Send Email to reporter
        try:
            send_mail(
                subject=f"CivicPortal: Update on your issue '{instance.title}'",
                message=f"Hello {instance.reported_by.get_full_name() or instance.reported_by.username},\n\nThe status of the issue you reported ('{instance.title}') has been updated to: {instance.get_status_display()}.\n\nThank you for using CivicPortal!",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.reported_by.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send email to reporter: {e}")


@receiver(post_save, sender=IssueComment)
def comment_added_signal(sender, instance, created, **kwargs):
    """
    Signal handler for when a comment is added to an issue.
    Sends WebSocket notifications to interested parties.
    """
    if created:
        # Send WebSocket notification
        send_comment_notification(
            issue_id=instance.issue.id,
            comment_id=instance.id,
            comment_text=instance.text,
            author=instance.author.username
        )

        # Create notifications for relevant users
        users_to_notify = set()

        # Notify issue reporter if not the commenter
        if instance.issue.reported_by != instance.author:
            users_to_notify.add(instance.issue.reported_by)

        # Notify assigned user if not the commenter
        if instance.issue.assigned_to and instance.issue.assigned_to != instance.author:
            users_to_notify.add(instance.issue.assigned_to)

        # Create notifications
        for user in users_to_notify:
            Notification.objects.create(
                user=user,
                notification_type='comment_added',
                title=f'New Comment on Issue: {instance.issue.title}',
                message=f'{instance.author.username} commented: {instance.text[:100]}...',
                related_issue=instance.issue
            )
