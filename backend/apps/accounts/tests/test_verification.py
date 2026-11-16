from datetime import timedelta
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import EmailVerificationCode
from apps.accounts.services import auth_service
from apps.accounts.services.email_service import get_latest_code


@pytest.mark.django_db
def test_email_verification_correct_code():
    client = APIClient()
    user = auth_service.register_student(
        full_name="Verify Student",
        email="verify@example.com",
        password="ValidPassword123!",
    )
    code = get_latest_code("verification", "verify@example.com")
    assert code is not None

    url = reverse("auth-verify-email")
    response = client.post(url, {"email": "verify@example.com", "code": code}, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    user.refresh_from_db()
    assert user.is_verified


@pytest.mark.django_db
def test_email_verification_incorrect_code():
    client = APIClient()
    auth_service.register_student(
        full_name="Wrong Code Student",
        email="wrongcode@example.com",
        password="ValidPassword123!",
    )

    url = reverse("auth-verify-email")
    response = client.post(url, {"email": "wrongcode@example.com", "code": "000000"}, format="json")
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert "Invalid code" in data["error"]["message"] or "Invalid code" in str(data["error"]["details"])


@pytest.mark.django_db
def test_email_verification_expired_code():
    client = APIClient()
    user = auth_service.register_student(
        full_name="Expired Code Student",
        email="expiredcode@example.com",
        password="ValidPassword123!",
    )
    code = get_latest_code("verification", "expiredcode@example.com")

    # Force expiration in DB
    code_obj = EmailVerificationCode.objects.filter(user=user).first()
    code_obj.expires_at = timezone.now() - timedelta(minutes=1)
    code_obj.save(update_fields=["expires_at"])

    url = reverse("auth-verify-email")
    response = client.post(url, {"email": "expiredcode@example.com", "code": code}, format="json")
    assert response.status_code == 400
    data = response.json()
    assert "expired" in str(data).lower()


@pytest.mark.django_db
def test_email_verification_reused_code():
    client = APIClient()
    auth_service.register_student(
        full_name="Reused Code Student",
        email="reused@example.com",
        password="ValidPassword123!",
    )
    code = get_latest_code("verification", "reused@example.com")

    url = reverse("auth-verify-email")
    # First attempt: succeeds
    res1 = client.post(url, {"email": "reused@example.com", "code": code}, format="json")
    assert res1.status_code == 200

    # Second attempt: user is already verified
    res2 = client.post(url, {"email": "reused@example.com", "code": code}, format="json")
    assert res2.status_code == 200  # idempotently returns verified


@pytest.mark.django_db
def test_email_verification_attempt_limit():
    client = APIClient()
    auth_service.register_student(
        full_name="Attempts Student",
        email="attempts@example.com",
        password="ValidPassword123!",
    )

    url = reverse("auth-verify-email")
    # Fail 5 times
    for _ in range(5):
        client.post(url, {"email": "attempts@example.com", "code": "999999"}, format="json")

    # 6th attempt should state too many failed attempts
    res = client.post(url, {"email": "attempts@example.com", "code": "999999"}, format="json")
    assert res.status_code == 400
    data = res.json()
    assert "too many" in str(data).lower() or "attempt" in str(data).lower()


@pytest.mark.django_db
def test_resend_verification_cooldown():
    client = APIClient()
    auth_service.register_student(
        full_name="Cooldown Student",
        email="cooldown@example.com",
        password="ValidPassword123!",
    )

    url = reverse("auth-resend-code")
    # Resend immediately should be blocked by 60s cooldown
    response = client.post(url, {"email": "cooldown@example.com"}, format="json")
    assert response.status_code == 400
    data = response.json()
    assert "wait" in str(data).lower()
