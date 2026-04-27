from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.departments.models import Department
from apps.issues.models import Issue

User = get_user_model()


class IssueAPITestCase(APITestCase):
    def setUp(self):
        self.department = Department.objects.create(
            name='Sanitation',
            email='sanitation@example.com',
            phone='1234567890',
            address='123 Civic Center',
            description='Sanitation department',
            contact_person='Dept Lead',
        )

        self.other_department = Department.objects.create(
            name='Roads',
            email='roads@example.com',
            phone='0987654321',
            address='456 City Hall',
            description='Road maintenance department',
            contact_person='Road Lead',
        )

        self.citizen = User.objects.create_user(
            username='citizen',
            email='citizen@example.com',
            password='testpass123',
        )
        self.other_citizen = User.objects.create_user(
            username='othercitizen',
            email='othercitizen@example.com',
            password='testpass123',
        )
        self.department_staff = User.objects.create_user(
            username='staff',
            email='staff@example.com',
            password='testpass123',
            is_department_staff=True,
            department=self.department,
        )
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123',
            is_staff=True,
        )

        self.citizen_issue = Issue.objects.create(
            title='Overflowing garbage bin',
            description='Bin needs clearing',
            priority='medium',
            category='sanitation',
            location='Ward 1',
            latitude=12.9716,
            longitude=77.5946,
            reported_by=self.citizen,
            department=self.department,
        )
        self.other_issue = Issue.objects.create(
            title='Broken streetlight',
            description='Streetlight not working',
            priority='high',
            category='lighting',
            location='Ward 2',
            reported_by=self.other_citizen,
            department=self.other_department,
        )
        self.assigned_issue = Issue.objects.create(
            title='Blocked drain',
            description='Drain is clogged',
            priority='high',
            category='drainage',
            location='Ward 3',
            latitude=12.9721,
            longitude=77.5933,
            reported_by=self.other_citizen,
            assigned_to=self.department_staff,
            department=self.other_department,
        )

        self.issue_list_url = '/api/issues/'
        self.citizen_issue_status_url = f'/api/issues/{self.citizen_issue.id}/update_status/'
        self.other_issue_detail_url = f'/api/issues/{self.other_issue.id}/'
        self.other_issue_status_url = f'/api/issues/{self.other_issue.id}/update_status/'
        self.assigned_issue_status_url = f'/api/issues/{self.assigned_issue.id}/update_status/'

    def test_citizen_sees_all_issues_for_map(self):
        self.client.force_authenticate(user=self.citizen)

        response = self.client.get(self.issue_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_department_staff_sees_all_issues(self):
        self.client.force_authenticate(user=self.department_staff)

        response = self.client.get(self.issue_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_admin_sees_all_issues(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.issue_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_citizen_cannot_update_other_users_issue(self):
        self.client.force_authenticate(user=self.citizen)

        response = self.client.patch(
            self.other_issue_detail_url,
            {'title': 'Unauthorized edit'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_department_staff_can_update_status_for_department_issue(self):
        self.client.force_authenticate(user=self.department_staff)

        response = self.client.post(
            self.citizen_issue_status_url,
            {'status': 'resolved'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.citizen_issue.refresh_from_db()
        self.assertEqual(self.citizen_issue.status, 'resolved')
        self.assertIsNotNone(self.citizen_issue.resolved_at)

    def test_department_staff_can_update_status_for_assigned_issue(self):
        self.client.force_authenticate(user=self.department_staff)

        response = self.client.post(
            self.assigned_issue_status_url,
            {'status': 'in_progress'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assigned_issue.refresh_from_db()
        self.assertEqual(self.assigned_issue.status, 'in_progress')

    def test_citizen_cannot_update_issue_status(self):
        self.client.force_authenticate(user=self.citizen)

        response = self.client.post(
            self.citizen_issue_status_url,
            {'status': 'resolved'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_status_is_rejected(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.citizen_issue_status_url,
            {'status': 'not-a-real-status'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_filter_by_category(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.issue_list_url, {'category': 'sanitation'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {issue['id'] for issue in response.data['results']}
        self.assertEqual(returned_ids, {self.citizen_issue.id})

    def test_admin_can_filter_issues_with_coordinates(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.issue_list_url, {'has_coordinates': 'true'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {issue['id'] for issue in response.data['results']}
        self.assertEqual(returned_ids, {self.citizen_issue.id, self.assigned_issue.id})

    def test_admin_can_search_issues(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.issue_list_url, {'search': 'streetlight'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {issue['id'] for issue in response.data['results']}
        self.assertEqual(returned_ids, {self.other_issue.id})

    def test_admin_can_order_issues_by_priority(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.issue_list_url, {'ordering': 'priority'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ordered_ids = [issue['id'] for issue in response.data['results']]
        self.assertEqual(ordered_ids, [self.other_issue.id, self.assigned_issue.id, self.citizen_issue.id])

    def test_admin_can_filter_issues_by_geo_radius(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(
            self.issue_list_url,
            {
                'latitude': 12.9716,
                'longitude': 77.5946,
                'radius_km': 1,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {issue['id'] for issue in response.data['results']}
        self.assertEqual(returned_ids, {self.citizen_issue.id, self.assigned_issue.id})
