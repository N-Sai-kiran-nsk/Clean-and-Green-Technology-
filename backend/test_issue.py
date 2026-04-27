"""Quick test to verify issue creation working"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.issues.models import Issue
from django.contrib.auth import get_user_model

User = get_user_model()

# Get all issues
issues = Issue.objects.all()
print(f"Total issues in database: {issues.count()}")

for issue in issues[:5]:
    print(f"  ID: {issue.id}, Title: {issue.title}, Status: {issue.status}")