"""
ASGI config for civic-issue-reporting project.
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path

from config.websocket_auth import JWTAuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

# Import consumers after django setup
from apps.notifications.consumers import NotificationConsumer
from apps.issues.consumers import IssueUpdateConsumer

websocket_urlpatterns = [
    path('ws/notifications/', NotificationConsumer.as_asgi()),
    path('ws/issues/', IssueUpdateConsumer.as_asgi()),
    path('ws/issues/<int:issue_id>/', IssueUpdateConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': JWTAuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
})
