import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User


@pytest.mark.django_db
def test_health_check_endpoint():
    client = APIClient()
    url = reverse("health-check")
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["server"] == "healthy"
    assert data["data"]["database"] == "healthy"


@pytest.mark.django_db
def test_custom_user_creation():
    user = User.objects.create_user(
        email="student@example.com",
        password="TestPassword123!",
        full_name="Test Student",
    )
    assert user.email == "student@example.com"
    assert user.full_name == "Test Student"
    assert user.check_password("TestPassword123!")
    assert not user.is_staff
    assert not user.is_superuser
    assert str(user) == "student@example.com (Test Student)"
