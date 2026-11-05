import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, EmailVerificationCode
from apps.accounts.services.email_service import get_latest_code


@pytest.mark.django_db
def test_valid_student_registration():
    client = APIClient()
    url = reverse("auth-register")
    payload = {
        "full_name": "Aayush Student",
        "email": "Aayush@Example.com",
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["email"] == "aayush@example.com"

    # User exists in DB with normalized email and is_verified=False
    user = User.objects.get(email="aayush@example.com")
    assert user.full_name == "Aayush Student"
    assert not user.is_verified
    assert not user.is_staff
    assert user.profile is not None

    # Verification code was created
    code_obj = EmailVerificationCode.objects.filter(user=user, is_used=False).first()
    assert code_obj is not None
    assert get_latest_code("verification", "aayush@example.com") is not None


@pytest.mark.django_db
def test_registration_duplicate_email():
    client = APIClient()
    url = reverse("auth-register")
    User.objects.create_user(
        email="existing@example.com",
        password="ValidPassword123!",
        full_name="Existing User",
    )
    payload = {
        "full_name": "Another User",
        "email": "existing@example.com",
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert "email" in data["error"]["details"]


@pytest.mark.django_db
def test_registration_invalid_email():
    client = APIClient()
    url = reverse("auth-register")
    payload = {
        "full_name": "Invalid Email",
        "email": "not-an-email",
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert "email" in data["error"]["details"]


@pytest.mark.django_db
def test_registration_weak_password():
    client = APIClient()
    url = reverse("auth-register")
    payload = {
        "full_name": "Weak Pass",
        "email": "weak@example.com",
        "password": "123",
        "confirm_password": "123",
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"


@pytest.mark.django_db
def test_registration_mismatched_password():
    client = APIClient()
    url = reverse("auth-register")
    payload = {
        "full_name": "Mismatch Pass",
        "email": "mismatch@example.com",
        "password": "StrongPassword123!",
        "confirm_password": "DifferentPassword123!",
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == 400
    data = response.json()
    assert "confirm_password" in data["error"]["details"]


@pytest.mark.django_db
def test_registration_missing_fields():
    client = APIClient()
    url = reverse("auth-register")
    payload = {
        "email": "missing@example.com",
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
