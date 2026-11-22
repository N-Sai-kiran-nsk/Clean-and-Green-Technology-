from django.contrib import admin
from .models import Issue, IssueAttachment, IssueComment


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'reported_by', 'assigned_to', 'department', 'created_at')
    list_filter = ('status', 'priority', 'assigned_to', 'department', 'created_at')
    search_fields = ('title', 'description')


@admin.register(IssueAttachment)
class IssueAttachmentAdmin(admin.ModelAdmin):
    list_display = ('issue', 'uploaded_at')


@admin.register(IssueComment)
class IssueCommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'issue', 'created_at')
