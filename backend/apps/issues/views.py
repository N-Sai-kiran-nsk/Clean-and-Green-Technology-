from math import cos, radians


from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from apps.notifications.utils import send_notification
from .models import Issue
from .serializers import IssueCreateSerializer, IssueSerializer, IssueCommentSerializer, IssueAttachmentSerializer

User = get_user_model()


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
            'assigned_by',
            'department',
        ).prefetch_related(
            'attachments',
            'comments__author',
            'upvotes',
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
        has_coordinates = self.request.query_params.get('has_coordinates')
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')

        if category_filter:
            queryset = queryset.filter(category__iexact=category_filter)

        for param_name, field_name in (
            ('department', 'department_id'),
            ('reported_by', 'reported_by_id'),
            ('assigned_to', 'assigned_to_id'),
        ):
            value = self.request.query_params.get(param_name)
            if value:
                try:
                    queryset = queryset.filter(**{field_name: int(value)})
                except (TypeError, ValueError):
                    pass

        if has_coordinates is not None:
            normalized = has_coordinates.lower()
            if normalized == 'true':
                queryset = queryset.filter(latitude__isnull=False, longitude__isnull=False)
            elif normalized == 'false':
                queryset = queryset.filter(Q(latitude__isnull=True) | Q(longitude__isnull=True))

        parsed_after = parse_date(created_after) if created_after else None
        parsed_before = parse_date(created_before) if created_before else None
        if parsed_after:
            queryset = queryset.filter(created_at__date__gte=parsed_after)
        if parsed_before:
            queryset = queryset.filter(created_at__date__lte=parsed_before)

        queryset = self._apply_geo_filters(queryset)

        return queryset.distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return IssueCreateSerializer
        return IssueSerializer

    def get_throttles(self):
        self.throttle_scope = 'issue_create' if self.action == 'create' else None
        return super().get_throttles()

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
            return issue.department_id == user.department_id or issue.assigned_to_id == user.id

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
    def assign(self, request, pk=None):
        issue = self.get_object()
        user = request.user
        is_admin = user.is_superuser or user.is_staff
        is_department_staff = getattr(user, 'is_department_staff', False)

        if not is_admin and not is_department_staff:
            return Response({'detail': 'You do not have permission to assign issues.'}, status=status.HTTP_403_FORBIDDEN)
        if not is_admin and issue.department_id != user.department_id and issue.assigned_to_id != user.id:
            return Response({'detail': 'You do not have permission to assign this issue.'}, status=status.HTTP_403_FORBIDDEN)

        assignee_value = request.data.get('assigned_to')
        assignee = None
        if assignee_value not in (None, '', 'null'):
            try:
                assignee = User.objects.get(pk=int(assignee_value), is_active=True)
            except (TypeError, ValueError, User.DoesNotExist):
                return Response({'assigned_to': 'An active user with this id does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

        assignee_id = assignee.id if assignee else None
        assignee_changed = issue.assigned_to_id != assignee_id
        issue.assigned_to = assignee
        issue.assigned_at = timezone.now() if assignee else None
        issue.assigned_by = user
        issue.save(update_fields=['assigned_to', 'assigned_at', 'assigned_by', 'updated_at'])

        if assignee_changed and assignee:
            send_notification(
                user_id=assignee.id,
                title=f'Issue Assigned: {issue.title}',
                message=f'You have been assigned to the issue "{issue.title}".',
                notification_type='issue_assigned',
                issue_id=issue.id,
            )

        return Response(IssueSerializer(issue, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        issue = self.get_object()

        if not self._can_update_status(issue):
            return Response({'detail': 'You do not have permission to update issue status.'}, status=status.HTTP_403_FORBIDDEN)

        status_value = request.data.get('status')
        if status_value in dict(Issue.STATUS_CHOICES):
            issue.status = status_value
            issue.resolved_at = timezone.now() if status_value == 'resolved' else None
            issue._actor = request.user
            issue.save(update_fields=['status', 'resolved_at', 'updated_at'])
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
