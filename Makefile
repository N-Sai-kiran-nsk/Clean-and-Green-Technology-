.PHONY: help build up down restart logs migrate superuser test clean

help:
	@echo "Civic Issue Reporting System - Make Commands"
	@echo ""
	@echo "  make build        - Build Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make logs      - View logs (follow mode)"
	@echo "  make migrate  - Run database migrations"
	@echo "  make superuser - Create admin user"
	@echo "  make test     - Run tests"
	@echo "  make clean   - Clean up containers and volumes"

build:
	docker-compose build

up:
	docker-compose up -d --build
	@echo ""
	@echo "Services started:"
	@echo "  Frontend: http://localhost:4200"
	@echo "  Backend API: http://localhost:8000"
	@echo "  Admin: http://localhost:8000/admin/"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

migrate:
	docker-compose run --rm backend python manage.py migrate

superuser:
	docker-compose run --rm backend python manage.py shell -c "\
from apps.users.models import User; \
if not User.objects.filter(username='admin').exists(): \
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123'); \
    print('Superuser created: admin / admin123'); \
else: \
    print('Superuser already exists');"

test:
	docker-compose run --rm backend python manage.py test

clean:
	docker-compose down -v
	-docker system prune -f