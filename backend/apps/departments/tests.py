from django.test import TestCase
from .models import Department


class DepartmentModelTest(TestCase):
    def setUp(self):
        self.department = Department.objects.create(
            name='Test Department',
            email='dept@example.com',
            phone='1234567890',
            address='123 Main St',
            contact_person='John Doe'
        )

    def test_department_creation(self):
        self.assertEqual(self.department.name, 'Test Department')
        self.assertTrue(self.department.is_active)
