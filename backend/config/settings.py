"""
Django settings for civic-issue-reporting project.
"""

import os
from pathlib import Path
from urllib.parse import urlparse
from decouple import config
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = ['*'] if DEBUG else config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    'corsheaders',

    # Local apps
    'apps.users',
    'apps.issues',
    'apps.departments',
    'apps.notifications',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / '../frontend/dist/civic-issue-reporting/browser'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASE_URL = config('DATABASE_URL', default=None)
DATABASE_ENGINE = config('DATABASE_ENGINE', default='django.db.backends.sqlite3')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
elif DATABASE_ENGINE == 'django.db.backends.sqlite3':
    DATABASES = {
        'default': {
            'ENGINE': DATABASE_ENGINE,
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': DATABASE_ENGINE,
            'NAME': config('DATABASE_NAME', default=config('POSTGRES_DB', default='civic_db')),
            'USER': config('DATABASE_USER', default=config('POSTGRES_USER', default='civic_user')),
            'PASSWORD': config('DATABASE_PASSWORD', default=config('POSTGRES_PASSWORD', default='civic_password')),
            'HOST': config('DATABASE_HOST', default=config('POSTGRES_HOST', default='localhost')),
            'PORT': config('DATABASE_PORT', default=config('POSTGRES_PORT', default='5432')),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'

FRONTEND_BUILD_DIR = BASE_DIR / '../frontend/dist/civic-issue-reporting/browser'
FRONTEND_DIST_DIR = BASE_DIR / '../frontend/dist/civic-issue-reporting'

STATICFILES_DIRS = []
if FRONTEND_BUILD_DIR.exists():
    STATICFILES_DIRS.append(FRONTEND_BUILD_DIR)
elif FRONTEND_DIST_DIR.exists():
    STATICFILES_DIRS.append(FRONTEND_DIST_DIR)

WHITENOISE_INDEX_FILE = True
WHITENOISE_ROOT = STATIC_ROOT

# Cloud Storage Configuration (AWS S3 / Cloudinary or Local Fallback)
USE_S3 = config('USE_S3', default=False, cast=bool)
USE_CLOUDINARY = config('USE_CLOUDINARY', default=False, cast=bool)

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
SERVE_MEDIA_LOCALLY = not USE_S3 and not USE_CLOUDINARY

AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
AWS_S3_ENDPOINT_URL = config('AWS_S3_ENDPOINT_URL', default='') or None
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='auto' if AWS_S3_ENDPOINT_URL else 'us-east-1')
AWS_S3_SIGNATURE_VERSION = config('AWS_S3_SIGNATURE_VERSION', default='s3v4')
AWS_S3_CUSTOM_DOMAIN = config('AWS_S3_CUSTOM_DOMAIN', default='') or config('AWS_MEDIA_CUSTOM_DOMAIN', default='')
AWS_MEDIA_CUSTOM_DOMAIN = config('AWS_MEDIA_CUSTOM_DOMAIN', default='') or AWS_S3_CUSTOM_DOMAIN
AWS_LOCATION = config('AWS_LOCATION', default='media').strip('/') or 'media'
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = False
AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}

if AWS_S3_ENDPOINT_URL:
    AWS_S3_ENDPOINT_URL = AWS_S3_ENDPOINT_URL.rstrip('/')

if AWS_S3_CUSTOM_DOMAIN:
    AWS_S3_CUSTOM_DOMAIN = urlparse(AWS_S3_CUSTOM_DOMAIN).netloc or AWS_S3_CUSTOM_DOMAIN

if AWS_MEDIA_CUSTOM_DOMAIN:
    AWS_MEDIA_CUSTOM_DOMAIN = urlparse(AWS_MEDIA_CUSTOM_DOMAIN).netloc or AWS_MEDIA_CUSTOM_DOMAIN

if not AWS_S3_CUSTOM_DOMAIN and AWS_STORAGE_BUCKET_NAME:
    if AWS_S3_ENDPOINT_URL:
        AWS_S3_CUSTOM_DOMAIN = urlparse(AWS_S3_ENDPOINT_URL).netloc
    else:
        AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com'

if not AWS_MEDIA_CUSTOM_DOMAIN:
    AWS_MEDIA_CUSTOM_DOMAIN = AWS_S3_CUSTOM_DOMAIN

if USE_S3:
    if 'storages' not in INSTALLED_APPS:
        INSTALLED_APPS.append('storages')
    default_storage_backend = 'storages.backends.s3boto3.S3Boto3Storage'
    if AWS_MEDIA_CUSTOM_DOMAIN:
        MEDIA_URL = f'https://{AWS_MEDIA_CUSTOM_DOMAIN}/{AWS_LOCATION}/'
elif USE_CLOUDINARY:
    if 'cloudinary_storage' not in INSTALLED_APPS:
        INSTALLED_APPS.extend(['cloudinary_storage', 'cloudinary'])
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME', default=''),
        'API_KEY': config('CLOUDINARY_API_KEY', default=''),
        'API_SECRET': config('CLOUDINARY_API_SECRET', default=''),
    }
    default_storage_backend = 'cloudinary_storage.storage.MediaCloudinaryStorage'
else:
    default_storage_backend = 'django.core.files.storage.FileSystemStorage'

STORAGES = {
    'default': {
        'BACKEND': default_storage_backend,
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

SENTRY_DSN = config('SENTRY_DSN', default='')
SENTRY_ENVIRONMENT = config('SENTRY_ENVIRONMENT', default='development')

if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            environment=SENTRY_ENVIRONMENT,
            integrations=[DjangoIntegration()],
        )
    except ImportError:
        pass

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='civicportal@example.com')


# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'config.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'auth': '10/min',
        'issue_create': '10/hour',
        'user': '120/min',
        'anon': '30/min',
    },
}

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Channels Configuration
ASGI_APPLICATION = 'config.asgi.application'

REDIS_URL = config('REDIS_URL', default=None)
REDIS_HOST = config('REDIS_HOST', default=None)
REDIS_PORT = config('REDIS_PORT', default=6379, cast=int)

if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
elif REDIS_HOST:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/1',
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [REDIS_URL],
            },
        }
    }
elif REDIS_HOST:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [(REDIS_HOST, REDIS_PORT)],
            },
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer"
        }
    }

# JWT Configuration
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_TOKEN': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}
