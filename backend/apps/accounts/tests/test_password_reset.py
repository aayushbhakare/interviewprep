from datetime import timedelta
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User, PasswordResetToken
from apps.accounts.services.email_service import get_latest_code
from apps.accounts.services import auth_service


@pytest.mark.django_db
def test_valid_password_reset_flow():
    client = APIClient()
    user = User.objects.create_user(
        email="reset_user@example.com",
        password="OldPassword123!",
        full_name="Reset User",
        is_verified=True,
    )
    tokens_before = auth_service.login_user("reset_user@example.com", "OldPassword123!")

    # 1. Request reset
    req_url = reverse("auth-password-reset-request")
    res_req = client.post(req_url, {"email": "reset_user@example.com"}, format="json")
    assert res_req.status_code == 200

    code = get_latest_code("password_reset", "reset_user@example.com")
    assert code is not None

    # 2. Confirm reset
    conf_url = reverse("auth-password-reset-confirm")
    payload = {
        "email": "reset_user@example.com",
        "code": code,
        "new_password": "BrandNewPassword123!",
        "confirm_password": "BrandNewPassword123!",
    }
    res_conf = client.post(conf_url, payload, format="json")
    assert res_conf.status_code == 200

    # 3. Old password fails
    user.refresh_from_db()
    assert not user.check_password("OldPassword123!")
    assert user.check_password("BrandNewPassword123!")

    # 4. Old sessions invalidated
    refresh_url = reverse("auth-token-refresh")
    res_refresh = client.post(
        refresh_url, {"refresh": tokens_before["refresh"]}, format="json"
    )
    assert res_refresh.status_code == 401


@pytest.mark.django_db
def test_password_reset_expired_code():
    client = APIClient()
    user = User.objects.create_user(
        email="reset_expired@example.com",
        password="OldPassword123!",
        full_name="Reset Expired",
        is_verified=True,
    )
    auth_service.request_password_reset("reset_expired@example.com")
    code = get_latest_code("password_reset", "reset_expired@example.com")

    # Force expiration in DB
    tok = PasswordResetToken.objects.filter(user=user).first()
    tok.expires_at = timezone.now() - timedelta(minutes=1)
    tok.save(update_fields=["expires_at"])

    conf_url = reverse("auth-password-reset-confirm")
    payload = {
        "email": "reset_expired@example.com",
        "code": code,
        "new_password": "BrandNewPassword123!",
        "confirm_password": "BrandNewPassword123!",
    }
    res = client.post(conf_url, payload, format="json")
    assert res.status_code == 400
    assert "expired" in str(res.json()).lower()


@pytest.mark.django_db
def test_password_reset_invalid_code():
    client = APIClient()
    User.objects.create_user(
        email="reset_inv@example.com",
        password="OldPassword123!",
        full_name="Reset Invalid",
        is_verified=True,
    )
    auth_service.request_password_reset("reset_inv@example.com")

    conf_url = reverse("auth-password-reset-confirm")
    payload = {
        "email": "reset_inv@example.com",
        "code": "000000",
        "new_password": "BrandNewPassword123!",
        "confirm_password": "BrandNewPassword123!",
    }
    res = client.post(conf_url, payload, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
def test_password_reset_reused_code():
    client = APIClient()
    User.objects.create_user(
        email="reset_reused@example.com",
        password="OldPassword123!",
        full_name="Reset Reused",
        is_verified=True,
    )
    auth_service.request_password_reset("reset_reused@example.com")
    code = get_latest_code("password_reset", "reset_reused@example.com")

    conf_url = reverse("auth-password-reset-confirm")
    payload = {
        "email": "reset_reused@example.com",
        "code": code,
        "new_password": "BrandNewPassword123!",
        "confirm_password": "BrandNewPassword123!",
    }
    res1 = client.post(conf_url, payload, format="json")
    assert res1.status_code == 200

    # Re-using code
    res2 = client.post(conf_url, payload, format="json")
    assert res2.status_code == 400
