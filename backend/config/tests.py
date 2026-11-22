from django.core.cache import cache
from django.test import TestCase


class HealthCheckTest(TestCase):
    def test_health_returns_ok(self):
        response = self.client.get('/health/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})


class AuthThrottleTest(TestCase):
    def test_login_is_rate_limited(self):
        cache.clear()
        for _ in range(10):
            self.client.post('/api/auth/login/', {'email': 'missing@example.com', 'password': 'wrong'})

        response = self.client.post('/api/auth/login/', {'email': 'missing@example.com', 'password': 'wrong'})
        self.assertEqual(response.status_code, 429)
        cache.clear()
