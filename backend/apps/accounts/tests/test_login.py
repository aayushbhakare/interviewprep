import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.accounts.services import auth_service


@pytest.mark.django_db
def test_login_successful():
    client = APIClient()
    User.objects.create_user(
        email="login_ok@example.com",
        password="ValidPassword123!",
        full_name="Login Success",
        is_verified=True,
    )

    url = reverse("auth-login")
    response = client.post(
        url,
        {"email": "login_ok@example.com", "password": "ValidPassword123!"},
        format="json",
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "access" in data["data"]
    assert "refresh" in data["data"]
    assert data["data"]["user"]["email"] == "login_ok@example.com"


@pytest.mark.django_db
def test_login_unverified_account():
    client = APIClient()
    User.objects.create_user(
        email="unverified@example.com",
        password="ValidPassword123!",
        full_name="Unverified User",
        is_verified=False,
    )

    url = reverse("auth-login")
    response = client.post(
        url,
        {"email": "unverified@example.com", "password": "ValidPassword123!"},
        format="json",
    )
    assert response.status_code == 401 or response.status_code == 403
    data = response.json()
    assert "verify" in str(data).lower()


@pytest.mark.django_db
def test_login_incorrect_credentials():
    client = APIClient()
    User.objects.create_user(
        email="wrongpass@example.com",
        password="CorrectPassword123!",
        full_name="Wrong Pass",
        is_verified=True,
    )

    url = reverse("auth-login")
    response = client.post(
        url,
        {"email": "wrongpass@example.com", "password": "IncorrectPassword!"},
        format="json",
    )
    assert response.status_code == 401 or response.status_code == 403


@pytest.mark.django_db
def test_token_refresh_workflow():
    client = APIClient()
    User.objects.create_user(
        email="refresh@example.com",
        password="ValidPassword123!",
        full_name="Refresh User",
        is_verified=True,
    )
    tokens = auth_service.login_user("refresh@example.com", "ValidPassword123!")

    url = reverse("auth-token-refresh")
    response = client.post(url, {"refresh": tokens["refresh"]}, format="json")
    assert response.status_code == 200
    data = response.json()
    assert "access" in data


@pytest.mark.django_db
def test_logout_blacklists_refresh_token():
    client = APIClient()
    User.objects.create_user(
        email="logout@example.com",
        password="ValidPassword123!",
        full_name="Logout User",
        is_verified=True,
    )
    tokens = auth_service.login_user("logout@example.com", "ValidPassword123!")

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    logout_url = reverse("auth-logout")
    res_logout = client.post(logout_url, {"refresh": tokens["refresh"]}, format="json")
    assert res_logout.status_code == 200

    # Try to use blacklisted refresh token
    refresh_url = reverse("auth-token-refresh")
    res_refresh = client.post(
        refresh_url, {"refresh": tokens["refresh"]}, format="json"
    )
    assert res_refresh.status_code == 401
