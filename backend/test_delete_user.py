import os
import sys
import django

# Setup Django
sys.path.append(r'c:\Users\N Sai Kiran\OneDrive\Desktop\civic\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

# Create a superuser
superuser, _ = User.objects.get_or_create(username='admin', email='admin@example.com')
superuser.set_password('password')
superuser.is_superuser = True
superuser.is_staff = True
superuser.save()

# Create a regular user
user1, _ = User.objects.get_or_create(username='user1', email='user1@example.com')
user1.set_password('password')
user1.save()

client = APIClient()
client.force_authenticate(user=superuser)

response = client.delete(f'/api/auth/{user1.id}/')
print("Delete user1 response status:", response.status_code)
print("Delete user1 response data:", response.data)
