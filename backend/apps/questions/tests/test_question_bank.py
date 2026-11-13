import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.administration.models import AdminActivityLog
from apps.questions.models import (
    Question,
    QuestionVersion,
    QuestionReport,
    QuestionValidationHistory,
)
from apps.questions.services.question_bank_service import (
    report_question,
    admin_create_question,
    admin_create_new_question_version,
)
from apps.questions.services.question_generator import (
    store_and_validate_question,
    seed_initial_question_bank,
)

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student_user(db):
    user = User.objects.create_user(
        email="quiz_student@example.com",
        password="SecurePassword123!",
        is_verified=True,
    )
    return user


@pytest.fixture
def admin_user(db):
    admin = User.objects.create_user(
        email="quiz_admin@example.com",
        password="AdminSecure123!",
        is_staff=True,
        is_superuser=True,
        is_verified=True,
    )
    return admin


@pytest.mark.django_db
def test_seed_initial_question_bank():
    created = seed_initial_question_bank("Python")
    assert created >= 40
    # Verify categories present
    cats = set(
        Question.objects.filter(technology="Python").values_list("category", flat=True)
    )
    assert Question.CATEGORY_OUTPUT in cats
    assert Question.CATEGORY_DEBUGGING in cats
    assert Question.CATEGORY_CODING in cats
    assert Question.CATEGORY_SCENARIO in cats
    assert Question.CATEGORY_CONCEPTUAL in cats


@pytest.mark.django_db
def test_question_validation_and_revision_loop():
    # Provide a defective question missing required code_snippet for output_prediction
    defective_data = {
        "prompt": "Predict the output of the following function execution:",
        "code_snippet": "",  # Missing!
        "expected_answer": "42",
        "explanation": "Evaluates to 42 based on mathematical execution rules.",
        "category": Question.CATEGORY_OUTPUT,
    }

    # store_and_validate_question should trigger revision and successfully validate
    q, v = store_and_validate_question(
        technology="Python",
        topic_slug="recursion",
        category=Question.CATEGORY_OUTPUT,
        difficulty="medium",
        content_data=defective_data,
        max_revisions=3,
    )

    records = list(QuestionValidationHistory.objects.filter(question_version=v))
    assert len(records) >= 2
    assert records[0].is_valid is False
    assert "code snippet is required" in records[0].failure_reason.lower()
    assert records[-1].is_valid is True
    assert v.validation_status == QuestionVersion.STATUS_APPROVED


@pytest.mark.django_db
def test_question_versioning_preserves_older_versions(admin_user):
    q, v1 = admin_create_question(
        admin_user=admin_user,
        technology="Python",
        topic_slug="generators",
        category=Question.CATEGORY_CONCEPTUAL,
        difficulty="easy",
        prompt="Initial prompt explaining how Python yield pauses execution frame.",
        expected_answer="yield pauses function execution and maintains local state.",
        explanation="Generators allow lazy memory-efficient evaluation.",
    )

    assert v1.version_number == 1
    assert q.current_version_number == 1

    # Admin updates question by creating version 2
    v2 = admin_create_new_question_version(
        admin_user=admin_user,
        question_id=str(q.id),
        prompt="Updated prompt detailing exact difference between yield and return statements.",
        expected_answer="yield preserves local frame state; return terminates the generator.",
        explanation="Comprehensive breakdown of Python generator mechanics.",
        change_reason="Clarified terminology",
    )

    q.refresh_from_db()
    assert q.current_version_number == 2
    assert v2.version_number == 2

    # Older version 1 remains unchanged in database
    v1_reloaded = QuestionVersion.objects.get(id=v1.id)
    assert v1_reloaded.version_number == 1
    assert "Initial prompt" in v1_reloaded.prompt


@pytest.mark.django_db
def test_question_reporting_duplicate_grouping_and_suspension(student_user):
    q, _ = admin_create_question(
        admin_user=student_user,
        technology="Python",
        topic_slug="scoping",
        category=Question.CATEGORY_DEBUGGING,
        difficulty="medium",
        prompt="Find the error in this variable scope resolution snippet:",
        code_snippet="def foo():\n    print(x)\n    x = 1",
        expected_answer="UnboundLocalError",
        explanation="Referenced before assignment.",
    )

    # First report
    rep1, created1 = report_question(
        student=student_user,
        question_id=str(q.id),
        reason=QuestionReport.REASON_AMBIGUOUS_WORDING,
        description="The snippet formatting is ambiguous.",
    )
    assert created1 is True

    # Duplicate report by same student on same question with same reason
    rep2, created2 = report_question(
        student=student_user,
        question_id=str(q.id),
        reason=QuestionReport.REASON_AMBIGUOUS_WORDING,
        description="Duplicate report submission.",
    )
    assert created2 is False
    assert rep1.id == rep2.id

    # Add more distinct reports from other simulated users to test threshold suspension
    for i in range(2):
        other_user = User.objects.create_user(
            email=f"reporter_{i}@example.com", password="Password123!", is_verified=True
        )
        report_question(
            student=other_user,
            question_id=str(q.id),
            reason=QuestionReport.REASON_INCORRECT_ANSWER,
            description="Incorrect solution.",
        )

    q.refresh_from_db()
    # >= 3 reports triggers suspension
    assert q.status == Question.STATUS_SUSPENDED


@pytest.mark.django_db
def test_admin_question_management_endpoints(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)

    # 1. Create Question
    create_url = reverse("admin-questions-list")
    resp = api_client.post(
        create_url,
        {
            "technology": "Django",
            "topic_slug": "orm-optimization",
            "category": "scenario",
            "difficulty": "hard",
            "prompt": "How do you detect and optimize N+1 database queries in Django REST Framework views?",
            "expected_answer": "Use select_related for ForeignKey/OneToOne and prefetch_related for ManyToMany/reverse FK.",
            "explanation": "select_related performs SQL joins; prefetch_related performs batch IN queries in Python.",
        },
        format="json",
    )
    assert resp.status_code == 201
    q_id = resp.data["data"]["id"]

    # 2. Check Admin Activity Log was written
    log_entry = AdminActivityLog.objects.filter(resource_id=q_id).first()
    assert log_entry is not None
    assert log_entry.action == "create_question"

    # 3. Create Version 2
    ver_url = reverse("admin-question-new-version", kwargs={"question_id": q_id})
    v2_resp = api_client.post(
        ver_url,
        {
            "prompt": "Revised prompt: How do you eliminate N+1 queries using Django ORM and django-debug-toolbar?",
            "expected_answer": "Use select_related and prefetch_related alongside django-debug-toolbar SQL inspection.",
            "explanation": "Inspect query count in debug toolbar to ensure constant O(1) queries.",
            "change_reason": "Added debug toolbar guidance",
        },
        format="json",
    )
    assert v2_resp.status_code == 201
    assert v2_resp.data["data"]["version_number"] == 2

    # 4. Alter Status to Inactive
    status_url = reverse("admin-question-status", kwargs={"question_id": q_id})
    st_resp = api_client.patch(
        status_url,
        {"status": "inactive", "notes": "Temporarily disabled"},
        format="json",
    )
    assert st_resp.status_code == 200
    assert st_resp.data["data"]["status"] == "inactive"
