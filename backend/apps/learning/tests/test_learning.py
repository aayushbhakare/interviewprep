import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.learning.models import Roadmap


@pytest.fixture
def verified_student():
    return User.objects.create_user(
        email="learn_student@example.com",
        password="ValidPassword123!",
        full_name="Learn Student",
        is_verified=True,
    )


@pytest.fixture
def unverified_student():
    return User.objects.create_user(
        email="unverified_learn@example.com",
        password="ValidPassword123!",
        full_name="Unverified Student",
        is_verified=False,
    )


@pytest.fixture
def other_student():
    return User.objects.create_user(
        email="other_student@example.com",
        password="ValidPassword123!",
        full_name="Other Student",
        is_verified=True,
    )


@pytest.mark.django_db
def test_get_catalog_public():
    client = APIClient()
    url = reverse("learning-catalog")
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "roles" in data
    assert "languages" in data
    assert "frameworks_by_language" in data
    assert "databases" in data
    assert "Django" in data["frameworks_by_language"]["Python"]
    assert "Spring Boot" in data["frameworks_by_language"]["Java"]


@pytest.mark.django_db
def test_unauthenticated_cannot_access_learn(verified_student):
    client = APIClient()
    url = reverse("learning-roadmap-active")
    response = client.get(url)
    assert response.status_code == 401


@pytest.mark.django_db
def test_unverified_student_cannot_create_roadmap(unverified_student):
    client = APIClient()
    client.force_authenticate(user=unverified_student)
    url = reverse("learning-roadmap-create")
    payload = {
        "role": "Backend Developer",
        "experience_level": "Fresher",
        "target_salary": "₹5–7 LPA",
        "language": "Python",
        "framework": "Django",
        "database": "PostgreSQL",
    }
    response = client.post(url, payload)
    assert response.status_code == 403


@pytest.mark.django_db
def test_valid_roadmap_creation(verified_student):
    client = APIClient()
    client.force_authenticate(user=verified_student)
    url = reverse("learning-roadmap-create")
    payload = {
        "role": "Backend Developer",
        "experience_level": "Fresher",
        "target_salary": "₹5–7 LPA",
        "language": "Python",
        "framework": "Django",
        "database": "PostgreSQL",
    }
    response = client.post(url, payload)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["role"] == "Backend Developer"
    assert data["language"] == "Python"
    assert data["framework"] == "Django"
    assert data["status"] == "ready"
    assert len(data["phases"]) >= 4

    stats = data["stats"]
    assert stats["total_topics"] > 0
    assert stats["completed_topics"] == 0
    assert stats["progress_percentage"] == 0

    # Retrieve active roadmap
    active_url = reverse("learning-roadmap-active")
    active_resp = client.get(active_url)
    assert active_resp.status_code == 200
    assert active_resp.json()["data"]["id"] == data["id"]


@pytest.mark.django_db
def test_invalid_framework_compatibility_rejected(verified_student):
    client = APIClient()
    client.force_authenticate(user=verified_student)
    url = reverse("learning-roadmap-create")
    # Python is not compatible with Spring Boot
    payload = {
        "role": "Backend Developer",
        "experience_level": "Fresher",
        "target_salary": "₹5–7 LPA",
        "language": "Python",
        "framework": "Spring Boot",
        "database": "PostgreSQL",
    }
    response = client.post(url, payload)
    assert response.status_code == 400


@pytest.mark.django_db
def test_custom_role_handling(verified_student):
    client = APIClient()
    client.force_authenticate(user=verified_student)
    url = reverse("learning-roadmap-create")
    payload = {
        "role": "Other",
        "custom_role": "Blockchain Core Engineer",
        "experience_level": "1–3 years",
        "target_salary": "₹15+ LPA",
        "language": "Rust",
        "framework": "Actix Web",
        "database": "PostgreSQL",
    }
    response = client.post(url, payload)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["role"] == "Blockchain Core Engineer"


@pytest.mark.django_db
def test_duplicate_active_roadmap_prevention(verified_student):
    client = APIClient()
    client.force_authenticate(user=verified_student)
    url = reverse("learning-roadmap-create")
    payload = {
        "role": "Backend Developer",
        "experience_level": "Fresher",
        "target_salary": "₹5–7 LPA",
        "language": "Python",
        "framework": "Django",
        "database": "PostgreSQL",
    }
    res1 = client.post(url, payload)
    assert res1.status_code == 201

    # Second attempt without replace=True should fail
    res2 = client.post(url, payload)
    assert res2.status_code == 400
    assert "already exists" in str(res2.json())


@pytest.mark.django_db
def test_roadmap_replacement_flow(verified_student):
    client = APIClient()
    client.force_authenticate(user=verified_student)
    create_url = reverse("learning-roadmap-create")
    replace_url = reverse("learning-roadmap-replace")

    res1 = client.post(create_url, {
        "role": "Python Developer",
        "experience_level": "Fresher",
        "language": "Python",
        "framework": "Django",
        "database": "PostgreSQL",
    })
    assert res1.status_code == 201
    old_id = res1.json()["data"]["id"]

    # Replace with Java roadmap
    res2 = client.post(replace_url, {
        "role": "Java Developer",
        "experience_level": "1–3 years",
        "target_salary": "₹10–15 LPA",
        "language": "Java",
        "framework": "Spring Boot",
        "database": "MySQL",
    })
    assert res2.status_code == 201
    new_id = res2.json()["data"]["id"]
    assert new_id != old_id

    # Verify old roadmap is now inactive
    old_roadmap = Roadmap.objects.get(id=old_id)
    assert not old_roadmap.is_active

    new_roadmap = Roadmap.objects.get(id=new_id)
    assert new_roadmap.is_active
    assert new_roadmap.language == "Java"


@pytest.mark.django_db
def test_topic_progress_and_skip(verified_student, other_student):
    client = APIClient()
    client.force_authenticate(user=verified_student)
    create_url = reverse("learning-roadmap-create")

    res = client.post(create_url, {
        "role": "Backend Developer",
        "experience_level": "Fresher",
        "language": "Python",
        "framework": "FastAPI",
        "database": "PostgreSQL",
    })
    assert res.status_code == 201
    roadmap_data = res.json()["data"]
    first_topic = roadmap_data["phases"][0]["weeks"][0]["topics"][0]
    topic_id = first_topic["id"]

    # 1. Mark Completed
    prog_url = reverse("learning-topic-progress", kwargs={"topic_id": topic_id})
    patch_res1 = client.patch(prog_url, {"status": "completed"})
    assert patch_res1.status_code == 200
    stats1 = patch_res1.json()["data"]["roadmap_stats"]
    assert stats1["completed_topics"] == 1
    assert stats1["skipped_topics"] == 0

    # 2. Skip topic (Not Verified)
    patch_res2 = client.patch(prog_url, {"status": "skipped"})
    assert patch_res2.status_code == 200
    stats2 = patch_res2.json()["data"]["roadmap_stats"]
    assert stats2["completed_topics"] == 0
    assert stats2["skipped_topics"] == 1

    # 3. Uncheck (Not Started)
    patch_res3 = client.patch(prog_url, {"status": "not_started"})
    assert patch_res3.status_code == 200
    stats3 = patch_res3.json()["data"]["roadmap_stats"]
    assert stats3["completed_topics"] == 0
    assert stats3["skipped_topics"] == 0

    # 4. Other student cannot modify this topic
    other_client = APIClient()
    other_client.force_authenticate(user=other_student)
    forbidden_res = other_client.patch(prog_url, {"status": "completed"})
    assert forbidden_res.status_code in [403, 404]


@pytest.mark.django_db
def test_topic_content_retrieval(verified_student):
    client = APIClient()
    client.force_authenticate(user=verified_student)
    create_url = reverse("learning-roadmap-create")

    res = client.post(create_url, {
        "role": "Backend Developer",
        "experience_level": "Fresher",
        "language": "Python",
        "framework": "Django",
        "database": "PostgreSQL",
    })
    topic_id = res.json()["data"]["phases"][0]["weeks"][0]["topics"][0]["id"]

    content_url = reverse("learning-topic-content", kwargs={"topic_id": topic_id})
    content_res = client.get(content_url)
    assert content_res.status_code == 200
    data = content_res.json()["data"]
    assert "learning_objectives" in data
    assert "concept_explanation" in data
    assert "how_it_works" in data
    assert "practical_implementation" in data
    assert "interview_perspective" in data
    assert "key_takeaways" in data
