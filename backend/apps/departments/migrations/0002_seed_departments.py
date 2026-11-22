from django.db import migrations

DEPARTMENTS = [
    {
        'name': 'Public Works',
        'email': 'public.works@civic.local',
        'phone': '10001',
        'address': 'Civic Centre, Public Works Division',
        'contact_person': 'Public Works Coordinator',
        'description': 'Roads, footpaths, bridges, and general public infrastructure.',
    },
    {
        'name': 'Sanitation',
        'email': 'sanitation@civic.local',
        'phone': '10002',
        'address': 'Civic Centre, Sanitation Division',
        'contact_person': 'Sanitation Officer',
        'description': 'Waste collection, drainage cleaning, and public hygiene.',
    },
    {
        'name': 'Electricity & Utilities',
        'email': 'utilities@civic.local',
        'phone': '10003',
        'address': 'Civic Centre, Utilities Division',
        'contact_person': 'Utilities Manager',
        'description': 'Street lighting, power supply, and utility maintenance.',
    },
    {
        'name': 'Roads & Traffic',
        'email': 'traffic@civic.local',
        'phone': '10004',
        'address': 'Civic Centre, Traffic Division',
        'contact_person': 'Traffic Engineer',
        'description': 'Traffic signals, signage, potholes, and road safety.',
    },
    {
        'name': 'Parks & Green Spaces',
        'email': 'parks@civic.local',
        'phone': '10005',
        'address': 'Civic Centre, Parks Division',
        'contact_person': 'Parks Supervisor',
        'description': 'Parks, trees, playgrounds, and public green areas.',
    },
    {
        'name': 'Public Safety',
        'email': 'safety@civic.local',
        'phone': '10006',
        'address': 'Civic Centre, Safety Division',
        'contact_person': 'Safety Officer',
        'description': 'Hazard reports, lighting, and public safety concerns.',
    },
    {
        'name': 'Water & Drainage',
        'email': 'water@civic.local',
        'phone': '10007',
        'address': 'Civic Centre, Water Division',
        'contact_person': 'Water Works Engineer',
        'description': 'Water supply, leaks, storm drains, and flooding.',
    },
    {
        'name': 'Health & Hygiene',
        'email': 'health@civic.local',
        'phone': '10008',
        'address': 'Civic Centre, Health Division',
        'contact_person': 'Health Inspector',
        'description': 'Public health, cleanliness, and hygiene complaints.',
    },
]


def seed_departments(apps, schema_editor):
    Department = apps.get_model('departments', 'Department')
    for item in DEPARTMENTS:
        Department.objects.get_or_create(name=item['name'], defaults=item)


def remove_departments(apps, schema_editor):
    Department = apps.get_model('departments', 'Department')
    Department.objects.filter(name__in=[item['name'] for item in DEPARTMENTS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('departments', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_departments, remove_departments),
    ]
