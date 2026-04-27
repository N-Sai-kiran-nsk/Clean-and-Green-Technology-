#!/usr/bin/env python
"""Test script for registration endpoint."""
import os
import sys
import django

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

def test_register():
    client = Client()
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    User.objects.filter(email='finaltest@example.com').delete()
    
    # Test registration
    response = client.post(
        '/api/auth/register/',
        data='{"email":"finaltest@example.com","password":"testpass123","first_name":"Test","last_name":"User"}',
        content_type='application/json'
    )
    
    print('Status:', response.status_code)
    try:
        data = response.json()
        print('Response:', data)
        
        # Check if we have the expected fields
        if 'access' in data:
            print('SUCCESS: Access token received')
        else:
            print('ERROR: Missing access token in response')
            
        if 'refresh' in data:
            print('SUCCESS: Refresh token received')
        else:
            print('ERROR: Missing refresh token in response')
            
        if 'user' in data:
            print('SUCCESS: User data received')
        else:
            print('ERROR: Missing user data in response')
            
    except Exception as e:
        print('ERROR:', e)

if __name__ == '__main__':
    test_register()