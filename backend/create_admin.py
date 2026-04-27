import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

try:
    user, created = User.objects.get_or_create(
        email='admin@civic.local',
        defaults={'username': 'civicadmin'}
    )
    user.set_password('adminpassword')
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print("\n=========================================")
    print("SUPER ADMIN READY!")
    print("Login Email: admin@civic.local")
    print("Password: adminpassword")
    print("=========================================\n")
except Exception as e:
    print(f"\nFailed to create admin: {e}\n")
