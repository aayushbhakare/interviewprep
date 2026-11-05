import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.accounts.services.email_service import get_latest_code
from apps.accounts.services import auth_service


@pytest.mark.django_db
def test_admin_login_requires_2fa():
    client = APIClient()
    User.objects.create_superuser(
        email="admin_test@example.com",
        password="AdminPassword123!",
        full_name="Admin Tester",
    )

    url = reverse("admin-auth-login")
    # Step 1: Login
    res_login = client.post(
        url,
        {"email": "admin_test@example.com", "password": "AdminPassword123!"},
        format="json",
    )
    assert res_login.status_code == 200
    data_login = res_login.json()["data"]
    assert data_login["status"] == "2fa_required"
    temp_token = data_login["temp_token"]

    code = get_latest_code("two_factor", "admin_test@example.com")
    assert code is not None

    # Step 2: 2FA Verify
    verify_url = reverse("admin-auth-2fa-verify")
    res_verify = client.post(
        verify_url,
        {"temp_token": temp_token, "code": code},
        format="json",
    )
    assert res_verify.status_code == 200
    data_verify = res_verify.json()["data"]
    assert "access" in data_verify
    assert data_verify["user"]["is_staff"] is True


@pytest.mark.django_db
def test_student_cannot_access_admin_endpoints():
    client = APIClient()
    User.objects.create_user(
        email="student_intruder@example.com",
        password="ValidPassword123!",
        full_name="Student Intruder",
        is_verified=True,
    )
    tokens = auth_service.login_user(
        "student_intruder@example.com", "ValidPassword123!"
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    # Try to access admin invitation endpoint
    invite_url = reverse("admin-invite")
    res = client.post(invite_url, {"email": "target@example.com"}, format="json")
    assert res.status_code == 403


@pytest.mark.django_db
def test_admin_invitation_flow():
    client = APIClient()
    User.objects.create_superuser(
        email="root_admin@example.com",
        password="AdminPassword123!",
        full_name="Root Admin",
    )
    tokens = auth_service.login_user("root_admin@example.com", "AdminPassword123!")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    # 1. Admin sends invitation
    invite_url = reverse("admin-invite")
    res_inv = client.post(invite_url, {"email": "new_admin@example.com"}, format="json")
    assert res_inv.status_code == 201

    token = get_latest_code("admin_invitation", "new_admin@example.com")
    assert token is not None

    # 2. Client logs out / unauthenticated user accepts invitation
    client.credentials()  # Clear auth header
    accept_url = reverse("admin-accept-invite")
    payload = {
        "token": token,
        "full_name": "Second Admin",
        "password": "SecondAdminSecret123!",
        "confirm_password": "SecondAdminSecret123!",
    }
    res_acc = client.post(accept_url, payload, format="json")
    assert res_acc.status_code == 201

    # Verify new user is staff
    new_admin = User.objects.get(email="new_admin@example.com")
    assert new_admin.is_staff
    assert new_admin.is_verified
    assert new_admin.is_admin_2fa_enabled
