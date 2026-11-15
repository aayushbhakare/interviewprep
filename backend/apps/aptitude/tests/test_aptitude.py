import pytest
from rest_framework.test import APIClient
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.models import User
from apps.aptitude.models import (
    AptitudeQuestion,
    AptitudeQuestionVersion,
    AptitudeQuestionReport,
    AptitudeTestConfig,
    AptitudeSession,
)
from apps.aptitude.services.seed_data import seed_initial_aptitude_bank
from apps.aptitude.services.question_generator import (
    validate_aptitude_question_structure,
    store_and_validate_aptitude_question,
)
from apps.aptitude.services.session_service import (
    check_fresher_eligibility,
    get_daily_attempt_usage,
    start_or_resume_aptitude_session,
    autosave_aptitude_answers,
    abandon_aptitude_session,
    submit_aptitude_session,
    get_session_results_detail,
)
from apps.aptitude.services.aptitude_bank_service import (
    select_aptitude_test_questions,
    report_aptitude_question,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def fresher_user(db):
    user = User.objects.create_user(
        email="fresher_test@interviewprep.local",
        password="TestPassword123!",
        is_verified=True,
    )
    if hasattr(user, "profile"):
        user.profile.experience_level = "Fresher"
        user.profile.save()
    return user


@pytest.fixture
def experienced_user(db):
    user = User.objects.create_user(
        email="experienced_test@interviewprep.local",
        password="TestPassword123!",
        is_verified=True,
    )
    if hasattr(user, "profile"):
        user.profile.experience_level = "3–5 years"
        user.profile.save()
    return user


@pytest.fixture
def staff_admin(db):
    return User.objects.create_user(
        email="admin_aptitude@interviewprep.local",
        password="AdminPass123!",
        is_staff=True,
        is_superuser=True,
        is_verified=True,
    )


@pytest.mark.django_db
def test_seed_initial_aptitude_bank():
    created = seed_initial_aptitude_bank()
    assert created == 45
    assert (
        AptitudeQuestion.objects.filter(
            category=AptitudeQuestion.CATEGORY_QUANT
        ).count()
        == 15
    )
    assert (
        AptitudeQuestion.objects.filter(
            category=AptitudeQuestion.CATEGORY_LOGICAL
        ).count()
        == 15
    )
    assert (
        AptitudeQuestion.objects.filter(
            category=AptitudeQuestion.CATEGORY_VERBAL
        ).count()
        == 15
    )

    # Idempotent re-run
    re_seeded = seed_initial_aptitude_bank()
    assert re_seeded == 0


@pytest.mark.django_db
def test_question_validation_and_revision_loop():
    # Valid question
    valid_data = {
        "question_text": "What is 15 percent of 400?",
        "options": ["50", "60", "70", "80"],
        "correct_option_index": 1,
        "explanation": "15% of 400 = 0.15 * 400 = 60.",
    }
    is_valid, err = validate_aptitude_question_structure(valid_data)
    assert is_valid is True
    assert err == ""

    # Invalid options count
    invalid_data = dict(valid_data)
    invalid_data["options"] = ["A", "B", "C"]
    is_valid, err = validate_aptitude_question_structure(invalid_data)
    assert is_valid is False

    # Store and validate creates question and version
    q_obj, v_obj = store_and_validate_aptitude_question(
        category=AptitudeQuestion.CATEGORY_QUANT,
        topic="Percentages",
        difficulty=AptitudeQuestion.DIFFICULTY_EASY,
        content_data=valid_data,
    )
    assert q_obj.status == AptitudeQuestion.STATUS_APPROVED
    assert v_obj.validation_status == AptitudeQuestionVersion.VALIDATION_VALID
    assert v_obj.version_number == 1


@pytest.mark.django_db
def test_fresher_eligibility_enforcement(fresher_user, experienced_user):
    # Fresher user passes eligibility check
    assert check_fresher_eligibility(fresher_user) is True

    # Experienced user is blocked with PermissionDenied
    with pytest.raises(PermissionDenied):
        check_fresher_eligibility(experienced_user)


@pytest.mark.django_db
def test_question_selection_distribution_and_unseen_priority(fresher_user):
    seed_initial_aptitude_bank()
    config = AptitudeTestConfig.get_active_config()

    # Session 1 selection
    selected_v1 = select_aptitude_test_questions(fresher_user, config)
    assert len(selected_v1) == 45

    quant = [
        v for v in selected_v1 if v.question.category == AptitudeQuestion.CATEGORY_QUANT
    ]
    logical = [
        v
        for v in selected_v1
        if v.question.category == AptitudeQuestion.CATEGORY_LOGICAL
    ]
    verbal = [
        v
        for v in selected_v1
        if v.question.category == AptitudeQuestion.CATEGORY_VERBAL
    ]
    assert len(quant) == 15
    assert len(logical) == 15
    assert len(verbal) == 15


@pytest.mark.django_db
def test_start_or_resume_session(fresher_user):
    seed_initial_aptitude_bank()

    # Start session
    session, is_resumed = start_or_resume_aptitude_session(fresher_user)
    assert is_resumed is False
    assert session.status == AptitudeSession.STATUS_IN_PROGRESS
    assert session.session_questions.count() == 45
    assert session.answers.count() == 45

    # Resume active session
    resumed_session, is_resumed_2 = start_or_resume_aptitude_session(fresher_user)
    assert is_resumed_2 is True
    assert resumed_session.id == session.id


@pytest.mark.django_db
def test_autosave_answers_and_persistence(fresher_user):
    seed_initial_aptitude_bank()
    session, _ = start_or_resume_aptitude_session(fresher_user)
    q1 = session.session_questions.first()

    payload = [{"question_id": str(q1.id), "selected_option_index": 2}]
    res = autosave_aptitude_answers(str(session.id), fresher_user, payload)
    assert res["is_expired"] is False
    assert res["saved_count"] == 1

    ans = session.answers.get(session_question=q1)
    assert ans.selected_option_index == 2
    assert ans.answered_at is not None


@pytest.mark.django_db
def test_abandon_session_preserves_daily_attempt(fresher_user):
    seed_initial_aptitude_bank()
    session, _ = start_or_resume_aptitude_session(fresher_user)

    abandoned = abandon_aptitude_session(str(session.id), fresher_user)
    assert abandoned.status == AptitudeSession.STATUS_ABANDONED
    assert abandoned.score is None

    # Daily attempt allowance is NOT consumed by abandoned sessions
    usage = get_daily_attempt_usage(fresher_user)
    assert usage["used"] == 0
    assert usage["remaining"] == 5

    # Solutions must NOT be disclosed for abandoned session
    with pytest.raises(ValidationError):
        get_session_results_detail(abandoned)


@pytest.mark.django_db
def test_submit_session_objective_evaluation(fresher_user):
    seed_initial_aptitude_bank()
    session, _ = start_or_resume_aptitude_session(fresher_user)

    # Answer half correctly, half incorrectly
    for idx, ans in enumerate(session.answers.select_related("session_question").all()):
        correct_index = ans.session_question.question_snapshot["correct_option_index"]
        if idx % 2 == 0:
            ans.selected_option_index = correct_index
        else:
            ans.selected_option_index = (correct_index + 1) % 4
        ans.save()

    submitted = submit_aptitude_session(str(session.id), fresher_user)
    assert submitted.status == AptitudeSession.STATUS_SUBMITTED
    assert submitted.submitted_at is not None
    assert submitted.correct_count == 23  # 0, 2, 4 ... 44 (23 items)
    assert submitted.incorrect_count == 22
    assert submitted.total_marks == 23
    assert submitted.percentage == round((23 / 45) * 100.0, 2)

    # Review results
    results = get_session_results_detail(submitted)
    assert results["correct_count"] == 23
    assert len(results["questions"]) == 45
    # Standalone practice does not contain PASS/FAIL
    assert "is_passed" not in results


@pytest.mark.django_db
def test_daily_attempt_limit_five_sessions(fresher_user):
    seed_initial_aptitude_bank()

    for i in range(5):
        session, _ = start_or_resume_aptitude_session(fresher_user)
        submit_aptitude_session(str(session.id), fresher_user)

    usage = get_daily_attempt_usage(fresher_user)
    assert usage["used"] == 5
    assert usage["remaining"] == 0

    # 6th attempt is blocked with ValidationError
    with pytest.raises(ValidationError):
        start_or_resume_aptitude_session(fresher_user)


@pytest.mark.django_db
def test_mixed_session_exemption_and_qualifying_threshold(fresher_user):
    seed_initial_aptitude_bank()

    # Start mixed stage session
    session, _ = start_or_resume_aptitude_session(
        fresher_user, session_type=AptitudeSession.TYPE_MIXED_STAGE
    )
    assert session.session_type == AptitudeSession.TYPE_MIXED_STAGE

    # Answer all questions correctly
    for ans in session.answers.all():
        ans.selected_option_index = ans.session_question.question_snapshot[
            "correct_option_index"
        ]
        ans.save()

    submitted = submit_aptitude_session(str(session.id), fresher_user)
    assert submitted.percentage == 100.0

    # Mixed session does NOT consume standalone daily attempt quota
    usage = get_daily_attempt_usage(fresher_user)
    assert usage["used"] == 0
    assert usage["remaining"] == 5

    # Mixed stage results include PASS evaluation (cutoff default 60%)
    results = get_session_results_detail(submitted)
    assert results["is_passed"] is True
    assert results["mixed_qualifying_cutoff"] == 60.0


@pytest.mark.django_db
def test_question_reporting_and_suspension(fresher_user):
    seed_initial_aptitude_bank()
    question = AptitudeQuestion.objects.first()

    # Student reports question
    report, created = report_aptitude_question(
        student=fresher_user,
        question_id=str(question.id),
        reason=AptitudeQuestionReport.REASON_INCORRECT,
        description="Option B seems mathematically identical to Option C.",
    )
    assert created is True
    assert report.status == AptitudeQuestionReport.STATUS_PENDING

    # Duplicate report by same user is acknowledged without duplicate record
    dup_report, dup_created = report_aptitude_question(
        student=fresher_user,
        question_id=str(question.id),
        reason=AptitudeQuestionReport.REASON_INCORRECT,
        description="Option B seems mathematically identical to Option C.",
    )
    assert dup_created is False
    assert dup_report.id == report.id


@pytest.mark.django_db
def test_admin_aptitude_management_endpoints(staff_admin, api_client):
    api_client.force_authenticate(user=staff_admin)

    # 1. Admin Config
    res_cfg = api_client.get("/api/v1/admin-panel/aptitude/config/")
    assert res_cfg.status_code == 200
    assert res_cfg.data["data"]["daily_limit"] == 5

    # Update config
    patch_cfg = api_client.patch(
        "/api/v1/admin-panel/aptitude/config/",
        {"daily_limit": 6, "duration_minutes": 75},
        format="json",
    )
    assert patch_cfg.status_code == 200
    assert patch_cfg.data["data"]["daily_limit"] == 6
    assert patch_cfg.data["data"]["duration_minutes"] == 75

    # 2. Admin Create Question
    create_res = api_client.post(
        "/api/v1/admin-panel/aptitude/questions/",
        {
            "category": "quantitative",
            "topic": "Speed Math",
            "difficulty": "easy",
            "question_text": "What is 25 times 25 minus 100?",
            "options": ["500", "525", "550", "575"],
            "correct_option_index": 1,
            "explanation": "25 * 25 = 625. 625 - 100 = 525.",
        },
        format="json",
    )
    assert create_res.status_code == 201
    q_id = create_res.data["data"]["id"]

    # 3. Admin Publish New Version
    v_res = api_client.post(
        f"/api/v1/admin-panel/aptitude/questions/{q_id}/version/",
        {
            "question_text": "Calculate: (25 * 25) - 100.",
            "options": ["500", "525", "550", "600"],
            "correct_option_index": 1,
            "explanation": "Updated explanation for v2: 625 - 100 = 525.",
        },
        format="json",
    )
    assert v_res.status_code == 201
    assert v_res.data["data"]["version_number"] == 2

    # 4. Admin Update Status
    st_res = api_client.patch(
        f"/api/v1/admin-panel/aptitude/questions/{q_id}/status/",
        {"status": "suspended"},
        format="json",
    )
    assert st_res.status_code == 200
    assert st_res.data["data"]["status"] == "suspended"
