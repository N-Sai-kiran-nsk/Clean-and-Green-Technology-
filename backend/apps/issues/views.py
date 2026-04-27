from math import cos, radians


from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Issue
from .serializers import IssueCreateSerializer, IssueSerializer, IssueCommentSerializer, IssueAttachmentSerializer
from apps.notifications.models import Notification


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['status', 'priority', 'category', 'department']
    search_fields = ['title', 'description', 'category', 'location']
    ordering_fields = ['created_at', 'updated_at', 'resolved_at', 'priority', 'status']
    ordering = ['-created_at']

    def _apply_geo_filters(self, queryset):
        try:
            latitude = self.request.query_params.get('latitude')
            longitude = self.request.query_params.get('longitude')
            radius_km = self.request.query_params.get('radius_km')

            if not all([latitude, longitude, radius_km]):
                return queryset

            latitude = float(latitude)
            longitude = float(longitude)
            radius_km = float(radius_km)

            if radius_km <= 0:
                return queryset

            lat_delta = radius_km / 111.0
            lng_divisor = max(cos(radians(latitude)), 0.01)
            lng_delta = radius_km / (111.0 * lng_divisor)

            return queryset.filter(
                latitude__isnull=False,
                longitude__isnull=False,
                latitude__gte=latitude - lat_delta,
                latitude__lte=latitude + lat_delta,
                longitude__gte=longitude - lng_delta,
                longitude__lte=longitude + lng_delta,
            )
        except (TypeError, ValueError):
            return queryset

    def get_queryset(self):
        user = self.request.user
        queryset = Issue.objects.select_related(
            'reported_by',
            'assigned_to',
            'department',
        ).prefetch_related(
            'attachments',
            'comments__author',
        )

        if not user.is_authenticated:
            pass  # Allow anonymous users to see all issues
        elif user.is_superuser or user.is_staff:
            pass
        elif getattr(user, 'is_department_staff', False):
            pass # Department staff should see all issues
        else:
            pass # Citizens should see all issues to browse "Issues near me"

        category_filter = self.request.query_params.get('category')
        department_filter = self.request.query_params.get('department')
        reported_by_filter = self.request.query_params.get('reported_by')
        assigned_to_filter = self.request.query_params.get('assigned_to')
        has_coordinates = self.request.query_params.get('has_coordinates')
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')

        if category_filter:
            queryset = queryset.filter(category__iexact=category_filter)
        if department_filter:
            queryset = queryset.filter(department_id=department_filter)
        if reported_by_filter:
            queryset = queryset.filter(reported_by_id=reported_by_filter)
        if assigned_to_filter:
            queryset = queryset.filter(assigned_to_id=assigned_to_filter)

        if has_coordinates is not None:
            normalized = has_coordinates.lower()
            if normalized == 'true':
                queryset = queryset.filter(latitude__isnull=False, longitude__isnull=False)
            elif normalized == 'false':
                queryset = queryset.filter(Q(latitude__isnull=True) | Q(longitude__isnull=True))

        if created_after:
            queryset = queryset.filter(created_at__date__gte=created_after)
        if created_before:
            queryset = queryset.filter(created_at__date__lte=created_before)

        queryset = self._apply_geo_filters(queryset)

        return queryset.distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return IssueCreateSerializer
        return IssueSerializer

    def _can_manage_issue(self, issue):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return True

        if getattr(user, 'is_department_staff', False):
            return issue.department_id == user.department_id or issue.assigned_to_id == user.id

        return issue.reported_by_id == user.id

    def _can_update_status(self, issue):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return True

        if getattr(user, 'is_department_staff', False):
            return True

        return False

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

    def update(self, request, *args, **kwargs):
        issue = self.get_object()
        if not self._can_manage_issue(issue):
            return Response({'detail': 'You do not have permission to modify this issue.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        issue = self.get_object()
        if not self._can_manage_issue(issue):
            return Response({'detail': 'You do not have permission to modify this issue.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        issue = self.get_object()
        if not self._can_manage_issue(issue):
            return Response({'detail': 'You do not have permission to delete this issue.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        issue = self.get_object()
        serializer = IssueCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(issue=issue, author=request.user)
            
            # Notify the user who reported the issue if someone else commented on it
            if request.user != issue.reported_by:
                Notification.objects.create(
                    user=issue.reported_by,
                    notification_type='comment_added',
                    title=f"New Comment on: {issue.title}",
                    message=f"{request.user.get_full_name() or request.user.username} commented on your issue.",
                    related_issue=issue
                )
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        issue = self.get_object()
        serializer = IssueAttachmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(issue=issue)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        issue = self.get_object()

        if not self._can_update_status(issue):
            return Response({'detail': 'You do not have permission to update issue status.'}, status=status.HTTP_403_FORBIDDEN)

        status_value = request.data.get('status')
        if status_value in dict(Issue.STATUS_CHOICES):
            old_status = issue.status
            issue.status = status_value
            issue.resolved_at = timezone.now() if status_value == 'resolved' else None
            issue.save(update_fields=['status', 'resolved_at', 'updated_at'])
            
            # Notify the user who reported the issue about the status change
            if old_status != status_value and request.user != issue.reported_by:
                Notification.objects.create(
                    user=issue.reported_by,
                    notification_type='status_update',
                    title=f"Issue Status Updated",
                    message=f"The status of your issue '{issue.title}' has been changed to {dict(Issue.STATUS_CHOICES).get(status_value, status_value)}.",
                    related_issue=issue
                )

            return Response(IssueSerializer(issue, context={'request': request}).data)
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_upvote(self, request, pk=None):
        issue = self.get_object()
        user = request.user
        
        if issue.upvotes.filter(id=user.id).exists():
            issue.upvotes.remove(user)
            has_upvoted = False
        else:
            issue.upvotes.add(user)
            has_upvoted = True
            
        return Response({
            'status': 'success',
            'upvotes_count': issue.upvotes.count(),
            'has_upvoted': has_upvoted
        })
