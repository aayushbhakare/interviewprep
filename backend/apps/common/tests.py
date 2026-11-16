import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.learning.models import Roadmap


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


@pytest.mark.django_db
def test_student_dashboard_requires_authentication():
    client = APIClient()
    url = reverse("student-dashboard")
    response = client.get(url)
    assert response.status_code == 401


@pytest.mark.django_db
def test_student_dashboard_empty_state():
    user = User.objects.create_user(
        email="student_dash@example.com",
        password="Password123!",
        full_name="Dashboard Student",
        is_verified=True,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse("student-dashboard")
    response = client.get(url)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["user"]["email"] == "student_dash@example.com"
    assert data["data"]["active_roadmap"] is None
    assert data["data"]["recent_activities"] == []
    assert len(data["data"]["shortcuts"]) == 4


@pytest.mark.django_db
def test_student_dashboard_with_active_roadmap():
    user = User.objects.create_user(
        email="roadmap_student@example.com",
        password="Password123!",
        full_name="Roadmap Student",
        is_verified=True,
    )
    Roadmap.objects.create(
        user=user,
        role="Backend Engineer",
        experience_level="1-3 years",
        target_salary="₹10–15 LPA",
        language="Python",
        framework="Django",
        database="PostgreSQL",
        status=Roadmap.STATUS_READY,
        is_active=True,
    )

    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse("student-dashboard")
    response = client.get(url)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "success"
    roadmap = data["data"]["active_roadmap"]
    assert roadmap is not None
    assert roadmap["role"] == "Backend Engineer"
    assert roadmap["target_salary"] == "₹10–15 LPA"
    assert roadmap["language"] == "Python"
    assert roadmap["weekly_quiz_status"] == "Available"
    assert len(data["data"]["recent_activities"]) == 1
    assert data["data"]["recent_activities"][0]["type"] == "roadmap"
