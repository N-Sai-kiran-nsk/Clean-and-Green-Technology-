"""
URL configuration for civic-issue-reporting project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/issues/', include('apps.issues.urls')),
    path('api/departments/', include('apps.departments.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]

urlpatterns += static('/', document_root=settings.MEDIA_ROOT)
