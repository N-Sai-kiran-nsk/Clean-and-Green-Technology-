import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

username = os.environ.get('DJANGO_ADMIN_USERNAME')
email = os.environ.get('DJANGO_ADMIN_EMAIL')
password = os.environ.get('DJANGO_ADMIN_PASSWORD')

if not (username and email and password):
    print("Admin bootstrap skipped: set DJANGO_ADMIN_USERNAME, DJANGO_ADMIN_EMAIL, and DJANGO_ADMIN_PASSWORD.")
else:
    user = User.objects.filter(username=username).first() or User.objects.filter(email=email).first()
    created = user is None

    if created:
        user = User.objects.create_user(username=username, email=email, password=password)

    if not (user.is_staff and user.is_superuser):
        user.is_staff = True
        user.is_superuser = True
        user.save()

    if created:
        print(f"Superuser '{username}' created.")
    else:
        print(f"Existing user '{user.username}' promoted to superuser.")
