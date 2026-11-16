import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.accounts.services.email_service import get_latest_code
from apps.accounts.services import auth_service


@pytest.mark.django_db
def test_profile_view_and_update():
    client = APIClient()
    User.objects.create_user(
        email="profile_test@example.com",
        password="ValidPassword123!",
        full_name="Profile Tester",
        is_verified=True,
    )
    tokens = auth_service.login_user("profile_test@example.com", "ValidPassword123!")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    url = reverse("account-profile")
    # GET profile
    res_get = client.get(url)
    assert res_get.status_code == 200
    data = res_get.json()["data"]
    assert data["email"] == "profile_test@example.com"
    assert data["full_name"] == "Profile Tester"

    # PATCH profile
    patch_payload = {
        "full_name": "Updated Name",
        "target_role": "Backend Developer",
        "experience_level": "1-3 years",
        "target_salary": "₹7–10 LPA",
    }
    res_patch = client.patch(url, patch_payload, format="json")
    assert res_patch.status_code == 200
    updated_data = res_patch.json()["data"]
    assert updated_data["full_name"] == "Updated Name"
    assert updated_data["target_role"] == "Backend Developer"
    assert updated_data["target_salary"] == "₹7–10 LPA"


@pytest.mark.django_db
def test_profile_change_password():
    client = APIClient()
    user = User.objects.create_user(
        email="change_pwd@example.com",
        password="InitialPassword123!",
        full_name="Change Password User",
        is_verified=True,
    )
    tokens = auth_service.login_user("change_pwd@example.com", "InitialPassword123!")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    url = reverse("account-change-password")
    payload = {
        "current_password": "InitialPassword123!",
        "new_password": "NewSecretPassword123!",
        "confirm_password": "NewSecretPassword123!",
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == 200

    user.refresh_from_db()
    assert user.check_password("NewSecretPassword123!")


@pytest.mark.django_db
def test_profile_change_email_workflow():
    client = APIClient()
    user = User.objects.create_user(
        email="old_email@example.com",
        password="ValidPassword123!",
        full_name="Change Email User",
        is_verified=True,
    )
    tokens = auth_service.login_user("old_email@example.com", "ValidPassword123!")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    # 1. Request change
    req_url = reverse("account-change-email-request")
    res_req = client.post(
        req_url,
        {"new_email": "brand_new@example.com", "password": "ValidPassword123!"},
        format="json",
    )
    assert res_req.status_code == 200

    code = get_latest_code("email_change", "brand_new@example.com")
    assert code is not None

    # 2. Confirm change
    conf_url = reverse("account-change-email-confirm")
    res_conf = client.post(
        conf_url,
        {"new_email": "brand_new@example.com", "code": code},
        format="json",
    )
    assert res_conf.status_code == 200

    user.refresh_from_db()
    assert user.email == "brand_new@example.com"


@pytest.mark.django_db
def test_profile_account_deletion():
    client = APIClient()
    User.objects.create_user(
        email="delete_me@example.com",
        password="ValidPassword123!",
        full_name="To Be Deleted",
        is_verified=True,
    )
    tokens = auth_service.login_user("delete_me@example.com", "ValidPassword123!")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    url = reverse("account-delete")
    payload = {
        "password": "ValidPassword123!",
        "confirmation": "DELETE",
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == 200

    assert not User.objects.filter(email="delete_me@example.com").exists()


@pytest.mark.django_db
def test_unauthorized_profile_access():
    client = APIClient()
    url = reverse("account-profile")
    response = client.get(url)
    assert response.status_code == 401
