"""
URL configuration for civic-issue-reporting project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/issues/', include('apps.issues.urls')),
    path('api/departments/', include('apps.departments.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all route to render Angular SPA frontend for any client-side route
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='home'),
]
