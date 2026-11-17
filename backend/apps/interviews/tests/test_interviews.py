import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserResumeVersion
from apps.administration.models import AdminActivityLog
from apps.aptitude.models import AptitudeSession
from apps.aptitude.services.seed_data import seed_initial_aptitude_bank
from apps.interviews.models import (
    InterviewCoolingPeriod,
    InterviewRound,
    InterviewSession,
)
from apps.interviews.services.interview_session_service import (
    complete_and_evaluate_session,
    create_interview_session,
    process_interview_turn,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student_user(db):
    user = User.objects.create_user(
        email="interview_student@interviewprep.local",
        password="TestPassword123!",
        is_verified=True,
    )
    if hasattr(user, "profile"):
        user.profile.experience_level = "Fresher"
        user.profile.target_role = "Backend Developer"
        user.profile.target_salary = "₹5–7 LPA"
        user.profile.save()
    return user


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email="interview_admin@interviewprep.local",
        password="AdminPassword123!",
        is_verified=True,
    )


@pytest.mark.django_db
def test_check_eligibility_and_prepopulate(student_user, api_client):
    api_client.force_authenticate(user=student_user)

    # 1. Eligibility check initially shows all types eligible
    res = api_client.get("/api/v1/interviews/eligibility/")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["technical"]["is_eligible"] is True
    assert data["hr"]["is_eligible"] is True
    assert data["mixed"]["is_eligible"] is True
    assert data["active_session"] is None

    # 2. Prepopulate setup data
    res_prep = api_client.get("/api/v1/interviews/setup-prepopulate/")
    assert res_prep.status_code == 200
    prep_data = res_prep.json()["data"]
    assert prep_data["role"] == "Backend Developer"
    assert prep_data["experience_level"] == "Fresher"
    assert prep_data["salary_range"] == "₹5–7 LPA"


@pytest.mark.django_db
def test_technical_interview_creation_and_questions(student_user, api_client):
    api_client.force_authenticate(user=student_user)
    payload = {
        "interview_type": "technical",
        "role": "Backend Developer",
        "experience_level": "Fresher",
        "salary_range": "₹5–7 LPA",
        "language": "Python",
        "framework": "Django",
        "database": "PostgreSQL",
    }
    res = api_client.post("/api/v1/interviews/sessions/start/", payload, format="json")
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["interview_type"] == "technical"
    assert data["status"] == "in_progress"
    assert data["final_result"] == "pending"
    assert data["total_questions"] >= 3
    assert len(data["turns"]) == 1
    assert data["turns"][0]["role"] == "interviewer"
    assert (
        "Python" in data["turns"][0]["content"]
        or "Django" in data["turns"][0]["content"]
        or "API" in data["turns"][0]["content"]
    )


@pytest.mark.django_db
def test_hr_interview_creation(student_user, api_client):
    api_client.force_authenticate(user=student_user)
    payload = {
        "interview_type": "hr",
        "role": "Frontend Developer",
        "experience_level": "Fresher",
        "salary_range": "₹5–7 LPA",
    }
    res = api_client.post("/api/v1/interviews/sessions/start/", payload, format="json")
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["interview_type"] == "hr"
    assert data["status"] == "in_progress"
    assert data["total_questions"] >= 4
    assert "introduce yourself" in data["turns"][0]["content"].lower()


@pytest.mark.django_db
def test_resume_version_snapshot_preservation(student_user):
    resume = UserResumeVersion.objects.create(
        user=student_user,
        version_number=1,
        storage_path="/resumes/v1.pdf",
        original_filename="aayush_resume.pdf",
        file_size_bytes=245000,
    )
    session = create_interview_session(
        student_user,
        {
            "interview_type": "technical",
            "role": "Full Stack Developer",
            "experience_level": "Fresher",
            "salary_range": "₹7–10 LPA",
            "language": "JavaScript",
            "framework": "React",
            "database": "PostgreSQL",
            "resume_version_reference": 1,
        },
    )
    assert session.resume_version_reference == 1
    assert session.resume_snapshot["original_filename"] == "aayush_resume.pdf"

    # Delete resume record to simulate future user changes
    resume.delete()
    session.refresh_from_db()
    # Snapshot remains intact
    assert session.resume_snapshot["original_filename"] == "aayush_resume.pdf"


@pytest.mark.django_db
def test_conversational_turn_progression(student_user, api_client):
    api_client.force_authenticate(user=student_user)
    session = create_interview_session(
        student_user,
        {
            "interview_type": "technical",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
            "language": "Python",
            "framework": "Django",
        },
    )

    # 1. Student answers question 1 with partial concept
    payload = {
        "speech_text": "In Django we use select_related for foreign keys to prevent N+1 queries."
    }
    res = api_client.post(
        f"/api/v1/interviews/sessions/{session.id}/turns/", payload, format="json"
    )
    assert res.status_code == 200
    turn_data = res.json()["data"]
    assert "interviewer_speech" in turn_data
    assert turn_data["status"] in ["follow_up", "next_question"]

    # 2. Student clarifies deeper aspect
    payload2 = {
        "speech_text": "select_related performs a SQL JOIN while prefetch_related executes a separate query with an IN clause."
    }
    res2 = api_client.post(
        f"/api/v1/interviews/sessions/{session.id}/turns/", payload2, format="json"
    )
    assert res2.status_code == 200
    assert res2.json()["data"]["next_question_index"] >= 1


@pytest.mark.django_db
def test_verbal_clarification_and_repeat_handling(student_user):
    session = create_interview_session(
        student_user,
        {
            "interview_type": "technical",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
        },
    )
    res = process_interview_turn(
        str(session.id),
        student_user,
        "Could you please clarify and repeat the question?",
    )
    assert res["status"] == "clarification"
    assert (
        "clarify" in res["interviewer_speech"].lower()
        or "repeat" in res["interviewer_speech"].lower()
    )
    assert res["next_question_index"] == 0


@pytest.mark.django_db
def test_i_dont_know_verbal_handling(student_user):
    session = create_interview_session(
        student_user,
        {
            "interview_type": "technical",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
        },
    )
    # Student states they do not know
    res = process_interview_turn(
        str(session.id), student_user, "I honestly don't know this concept, pass."
    )
    assert res["status"] == "next_question"
    assert res["next_question_index"] == 1
    assert (
        "no problem" in res["interviewer_speech"].lower()
        or "move on" in res["interviewer_speech"].lower()
    )


@pytest.mark.django_db
def test_mixed_recruitment_fresher_round_generation(student_user):
    seed_initial_aptitude_bank()
    session = create_interview_session(
        student_user,
        {
            "interview_type": "mixed",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
            "language": "Python",
            "framework": "Django",
            "database": "PostgreSQL",
        },
    )
    rounds = session.rounds.all().order_by("round_number")
    assert rounds.count() == 4
    assert rounds[0].round_type == InterviewRound.ROUND_APTITUDE
    assert rounds[0].status == InterviewRound.STATUS_IN_PROGRESS
    assert rounds[0].aptitude_session is not None
    assert rounds[0].aptitude_session.session_type == AptitudeSession.TYPE_MIXED_STAGE
    assert rounds[1].round_type == InterviewRound.ROUND_TECHNICAL_1
    assert rounds[1].status == InterviewRound.STATUS_PENDING
    assert rounds[2].round_type == InterviewRound.ROUND_TECHNICAL_2
    assert rounds[3].round_type == InterviewRound.ROUND_HR


@pytest.mark.django_db
def test_mixed_recruitment_experienced_round_generation(student_user):
    session = create_interview_session(
        student_user,
        {
            "interview_type": "mixed",
            "role": "Backend Developer",
            "experience_level": "3–5 years",
            "salary_range": "₹15+ LPA",
            "language": "Go",
            "framework": "gRPC",
            "database": "PostgreSQL",
        },
    )
    rounds = session.rounds.all().order_by("round_number")
    assert rounds.count() == 3
    # Experienced candidates do not have aptitude round
    assert rounds[0].round_type == InterviewRound.ROUND_TECHNICAL_1
    assert rounds[0].status == InterviewRound.STATUS_IN_PROGRESS
    assert rounds[1].round_type == InterviewRound.ROUND_TECHNICAL_2
    assert rounds[2].round_type == InterviewRound.ROUND_HR


@pytest.mark.django_db
def test_mixed_aptitude_stage_passing_advances_to_round_2(student_user, api_client):
    api_client.force_authenticate(user=student_user)
    seed_initial_aptitude_bank()
    session = create_interview_session(
        student_user,
        {
            "interview_type": "mixed",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
            "language": "Python",
        },
    )
    r1 = session.rounds.get(round_number=1)
    apt_sess = r1.aptitude_session

    # Simulate student submitting aptitude with 75% score (>= 60% cutoff)
    apt_sess.status = AptitudeSession.STATUS_SUBMITTED
    apt_sess.percentage = 75.0
    apt_sess.correct_count = 34
    apt_sess.total_questions = 45
    apt_sess.save()

    res = api_client.post(
        f"/api/v1/interviews/sessions/{session.id}/rounds/complete-aptitude/"
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["result"] == "pass"
    assert data["is_passed"] is True

    r1.refresh_from_db()
    assert r1.status == InterviewRound.STATUS_COMPLETED
    assert r1.result == "pass"

    r2 = session.rounds.get(round_number=2)
    assert r2.status == InterviewRound.STATUS_IN_PROGRESS


@pytest.mark.django_db
def test_mixed_aptitude_stage_failing_aborts_entire_mixed_process(
    student_user, api_client
):
    api_client.force_authenticate(user=student_user)
    seed_initial_aptitude_bank()
    session = create_interview_session(
        student_user,
        {
            "interview_type": "mixed",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
            "language": "Python",
        },
    )
    r1 = session.rounds.get(round_number=1)
    apt_sess = r1.aptitude_session

    # Simulate student scoring 40% (< 60% cutoff)
    apt_sess.status = AptitudeSession.STATUS_SUBMITTED
    apt_sess.percentage = 40.0
    apt_sess.correct_count = 18
    apt_sess.total_questions = 45
    apt_sess.save()

    res = api_client.post(
        f"/api/v1/interviews/sessions/{session.id}/rounds/complete-aptitude/"
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["result"] == "fail"
    assert data["is_passed"] is False

    session.refresh_from_db()
    assert session.status == InterviewSession.STATUS_COMPLETED
    assert session.final_result == "fail"

    # Subsequent rounds marked not_attempted
    for r in session.rounds.filter(round_number__gt=1):
        assert r.status == InterviewRound.STATUS_NOT_ATTEMPTED

    # 24-hour cooling period created for Mixed
    cooling = InterviewCoolingPeriod.objects.filter(
        user=student_user, interview_type="mixed"
    ).first()
    assert cooling is not None
    assert cooling.is_active is True


@pytest.mark.django_db
def test_independent_cooling_periods(student_user, api_client):
    api_client.force_authenticate(user=student_user)

    # 1. Create and fail a Technical interview
    tech_sess = create_interview_session(
        student_user,
        {
            "interview_type": "technical",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
            "language": "Python",
        },
    )
    # Complete and force failure
    tech_sess.ai_conversation_state = {
        "questions": [{"question_text": "Q1"}],
        "turns": [{"role": "student", "content": "i don't know", "question_index": 0}],
    }
    complete_and_evaluate_session(tech_sess)
    tech_sess.refresh_from_db()
    assert tech_sess.final_result == "fail"

    # 2. Check eligibility: Technical is in cooling, HR and Mixed remain eligible!
    res_elig = api_client.get("/api/v1/interviews/eligibility/")
    elig_data = res_elig.json()["data"]
    assert elig_data["technical"]["is_eligible"] is False
    assert elig_data["technical"]["remaining_seconds"] > 0
    assert elig_data["hr"]["is_eligible"] is True
    assert elig_data["mixed"]["is_eligible"] is True

    # 3. Trying to start another Technical interview is rejected with 403
    res_blocked = api_client.post(
        "/api/v1/interviews/sessions/start/",
        {
            "interview_type": "technical",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
            "language": "Python",
        },
        format="json",
    )
    assert res_blocked.status_code == 403

    # 4. Starting an HR interview succeeds without hindrance!
    res_hr = api_client.post(
        "/api/v1/interviews/sessions/start/",
        {
            "interview_type": "hr",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
        },
        format="json",
    )
    assert res_hr.status_code == 201


@pytest.mark.django_db
def test_abandon_session_does_not_incur_cooling(student_user, api_client):
    api_client.force_authenticate(user=student_user)
    session = create_interview_session(
        student_user,
        {
            "interview_type": "technical",
            "role": "Backend Developer",
            "experience_level": "Fresher",
            "salary_range": "₹5–7 LPA",
            "language": "Python",
        },
    )
    res = api_client.post(f"/api/v1/interviews/sessions/{session.id}/abandon/")
    assert res.status_code == 200
    session.refresh_from_db()
    assert session.status == InterviewSession.STATUS_ABANDONED
    assert session.final_result == InterviewSession.RESULT_ABANDONED

    # Student has zero cooling records
    cooling_count = InterviewCoolingPeriod.objects.filter(user=student_user).count()
    assert cooling_count == 0


@pytest.mark.django_db
def test_admin_interview_config_and_activity_logging(admin_user, api_client):
    api_client.force_authenticate(user=admin_user)

    # 1. Fetch current config
    res_get = api_client.get("/api/v1/admin-panel/interviews/config/")
    assert res_get.status_code == 200
    assert res_get.json()["data"]["technical_cooling_hours"] == 24

    # 2. Update cooling hours to 12
    payload = {"technical_cooling_hours": 12, "mixed_cooling_hours": 36}
    res_patch = api_client.patch(
        "/api/v1/admin-panel/interviews/config/", payload, format="json"
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["data"]["technical_cooling_hours"] == 12

    # 3. Verify AdminActivityLog audit entry
    log_entry = AdminActivityLog.objects.filter(
        action="update_interview_config"
    ).first()
    assert log_entry is not None
    assert log_entry.actor == admin_user


@pytest.mark.django_db
def test_admin_interview_analytics_endpoint(admin_user, api_client):
    api_client.force_authenticate(user=admin_user)
    res = api_client.get("/api/v1/admin-panel/interviews/analytics/")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "total_sessions" in data
    assert "completed_sessions" in data
    assert "overall_pass_rate" in data
    assert "ai_telemetry" in data
