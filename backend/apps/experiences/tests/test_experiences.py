import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.experiences.models import (
    InterviewExperience,
    ExperienceVersion,
    StudentReportedQuestion,
)
from apps.experiences.services.experience_service import ExperienceService
from apps.learning.models import (
    Roadmap,
    RoadmapPhase,
    RoadmapWeek,
    RoadmapTopicReference,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student_user(db):
    user = User.objects.create_user(
        email="test_student@interviewprep.local",
        password="TestPassword123!",
        is_verified=True,
    )
    if hasattr(user, "profile"):
        user.profile.full_name = "Alex Johnson"
        user.profile.target_role = "Backend Engineer"
        user.profile.save()
    return user


@pytest.fixture
def other_student(db):
    return User.objects.create_user(
        email="other_student@interviewprep.local",
        password="TestPassword123!",
        is_verified=True,
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email="moderator_admin@interviewprep.local",
        password="AdminPassword123!",
        is_verified=True,
    )


@pytest.fixture
def sample_stages():
    return [
        {
            "stage_type": "aptitude_test",
            "custom_stage_name": "Online Screening Assessment",
            "order": 1,
            "interview_mode": "Online",
            "difficulty": "Medium",
            "result": "Cleared",
            "description": "30 MCQs on quantitative aptitude and basic DSA.",
            "questions": [
                {
                    "question_text": "Solve two-sum array problem in O(N) time complexity.",
                    "interviewer_approach": "Looked for hash map lookup rather than nested loops.",
                    "student_response": "Used single pass dictionary indexing complement values.",
                    "order": 1,
                }
            ],
        },
        {
            "stage_type": "technical_1",
            "custom_stage_name": "Core Technical Round",
            "order": 2,
            "interview_mode": "Online",
            "difficulty": "Hard",
            "result": "Cleared",
            "description": "Deep dive into Django ORM query optimization and database indexing.",
            "questions": [
                {
                    "question_text": "Explain select_related vs prefetch_related in Django ORM with SQL queries generated.",
                    "follow_up_text": "How do you avoid N+1 query overhead in high-throughput APIs?",
                    "interviewer_approach": "Checked understanding of inner join vs in-memory python prefetching.",
                    "student_response": "Detailed ForeignKey single join vs many-to-many separate query sets.",
                    "order": 1,
                }
            ],
        },
    ]


@pytest.mark.django_db
def test_save_and_update_draft_experience(
    student_user, other_student, api_client, sample_stages
):
    api_client.force_authenticate(user=student_user)

    # 1. Create Draft
    payload = {
        "company_name": "Acme Global Tech",
        "role": "Backend Engineer",
        "experience_level": "Fresher",
        "salary_range": "₹6 - ₹10 LPA",
        "company_location": "Bengaluru, India",
        "recruitment_year": 2025,
        "job_type": "Full-time",
        "interview_mode": "Online",
        "overall_difficulty": "Medium",
        "overall_outcome": "selected",
        "additional_context": "Comprehensive recruitment drive with 2 technical rounds.",
        "is_anonymous": True,
        "stages": sample_stages,
    }

    res = api_client.post("/api/v1/experiences/drafts/", payload, format="json")
    assert res.status_code == 201
    data = res.json()["data"]
    exp_id = data["id"]
    assert data["company_name"] == "Acme Global Tech"
    assert data["status"] == "draft"
    assert len(data["stages"]) == 2
    assert data["stages"][1]["questions"][0]["question_text"].startswith(
        "Explain select_related"
    )

    # 2. Update Draft
    payload["company_name"] = "Acme Tech Systems"
    res_update = api_client.put(
        f"/api/v1/experiences/drafts/{exp_id}/", payload, format="json"
    )
    assert res_update.status_code == 200
    assert res_update.json()["data"]["company_name"] == "Acme Tech Systems"

    # 3. Unauthorized access by another student
    api_client.force_authenticate(user=other_student)
    res_unauth = api_client.put(
        f"/api/v1/experiences/drafts/{exp_id}/", payload, format="json"
    )
    assert res_unauth.status_code == 403


@pytest.mark.django_db
def test_low_risk_auto_publish_and_extraction(student_user, api_client, sample_stages):
    api_client.force_authenticate(user=student_user)

    # 1. Save draft
    exp = ExperienceService.save_draft(
        user=student_user,
        data={
            "company_name": "Tech Corp Labs",
            "role": "Backend Engineer",
            "experience_level": "1-3 Years",
            "salary_range": "₹10 - ₹18 LPA",
            "overall_outcome": "selected",
            "is_anonymous": False,
            "stages": sample_stages,
        },
    )

    # 2. Publish experience
    res = api_client.post(f"/api/v1/experiences/{exp.id}/publish/", {}, format="json")
    assert res.status_code == 200
    res_data = res.json()["data"]
    assert res_data["status"] == "published"
    assert res_data["risk_level"] == "low"
    assert res_data["extracted_questions"] >= 1

    exp.refresh_from_db()
    assert exp.status == InterviewExperience.STATUS_PUBLISHED
    assert exp.published_version == 1

    # Verify extracted student question exists and is tagged with Django
    q = StudentReportedQuestion.objects.filter(source_experience=exp).first()
    assert q is not None
    assert q.is_active is True
    assert "Django" in q.technology or "Data Structures" in q.technology


@pytest.mark.django_db
def test_high_risk_moderation_queue(student_user, api_client, sample_stages):
    api_client.force_authenticate(user=student_user)

    # Add PII to stage notes
    stages_with_pii = list(sample_stages)
    stages_with_pii[0]["additional_notes"] = (
        "Contact interviewer directly at +919876543210 or recruiter@acme.com"
    )

    exp = ExperienceService.save_draft(
        user=student_user,
        data={
            "company_name": "Private Enterprise",
            "role": "Software Engineer",
            "experience_level": "Fresher",
            "salary_range": "₹6 - ₹10 LPA",
            "overall_outcome": "rejected",
            "stages": stages_with_pii,
        },
    )

    res = api_client.post(f"/api/v1/experiences/{exp.id}/publish/", {}, format="json")
    assert res.status_code == 200
    res_data = res.json()["data"]
    assert res_data["status"] == "pending_review"
    assert res_data["risk_level"] == "high"
    assert any(
        "phone" in issue.lower() or "email" in issue.lower()
        for issue in res_data["flagged_issues"]
    )

    exp.refresh_from_db()
    assert exp.status == InterviewExperience.STATUS_PENDING_REVIEW
    # It must not be listed in public discovery feed
    pub_res = api_client.get("/api/v1/experiences/")
    assert not any(item["id"] == str(exp.id) for item in pub_res.json()["results"])


@pytest.mark.django_db
def test_safe_editing_of_published_experience(student_user, api_client, sample_stages):
    api_client.force_authenticate(user=student_user)

    # 1. Create and auto-publish initial version
    exp = ExperienceService.save_draft(
        user=student_user,
        data={
            "company_name": "Pinnacle Systems",
            "role": "Backend Engineer",
            "experience_level": "Fresher",
            "salary_range": "₹6 - ₹10 LPA",
            "overall_outcome": "selected",
            "stages": sample_stages,
        },
    )
    ExperienceService.publish_experience(user=student_user, experience_id=str(exp.id))
    exp.refresh_from_db()
    assert exp.status == InterviewExperience.STATUS_PUBLISHED
    assert exp.published_version == 1

    # 2. Student edits published experience with content that flags for review
    stages_with_flag = list(sample_stages)
    stages_with_flag[0]["additional_notes"] = (
        "Join telegram group t.me/freeinterviewquestions for leak"
    )

    update_payload = {
        "company_name": "Pinnacle Systems Inc",
        "role": "Senior Backend Engineer",
        "experience_level": "1-3 Years",
        "salary_range": "₹10 - ₹18 LPA",
        "overall_outcome": "selected",
        "stages": stages_with_flag,
    }

    res_edit = api_client.put(
        f"/api/v1/experiences/{exp.id}/edit-published/", update_payload, format="json"
    )
    assert res_edit.status_code == 200
    data_edit = res_edit.json()["data"]
    assert data_edit["status"] == "pending_review"

    # The canonical experience remains published with original version 1 visible!
    exp.refresh_from_db()
    assert exp.status == InterviewExperience.STATUS_PUBLISHED
    assert exp.company_name == "Pinnacle Systems"
    assert exp.published_version == 1

    # Version 2 is recorded as pending review
    v2 = ExperienceVersion.objects.get(experience=exp, version_number=2)
    assert v2.status == ExperienceVersion.STATUS_PENDING_REVIEW
    assert v2.is_published is False


@pytest.mark.django_db
def test_anonymous_vs_named_presentation(
    student_user, admin_user, api_client, sample_stages
):
    # 1. Anonymous experience
    exp_anon = ExperienceService.save_draft(
        user=student_user,
        data={
            "company_name": "Confidential Corp",
            "role": "Security Analyst",
            "experience_level": "Fresher",
            "overall_outcome": "selected",
            "is_anonymous": True,
            "stages": sample_stages,
        },
    )
    ExperienceService.publish_experience(
        user=student_user, experience_id=str(exp_anon.id)
    )

    # Public check
    pub_res = api_client.get(f"/api/v1/experiences/{exp_anon.id}/")
    assert pub_res.status_code == 200
    assert pub_res.json()["data"]["author_display_name"] == "Anonymous Candidate"

    # Admin check reveals author real email
    api_client.force_authenticate(user=admin_user)
    adm_res = api_client.get(f"/api/v1/admin-panel/experiences/{exp_anon.id}/")
    assert adm_res.status_code == 200
    assert adm_res.json()["data"]["author_real_email"] == student_user.email


@pytest.mark.django_db
def test_helpful_votes_and_community_reports(
    student_user, other_student, api_client, sample_stages
):
    # Setup published experience
    exp = ExperienceService.save_draft(
        user=student_user,
        data={
            "company_name": "Apex Innovations",
            "role": "Frontend Engineer",
            "experience_level": "Fresher",
            "overall_outcome": "selected",
            "stages": sample_stages,
        },
    )
    ExperienceService.publish_experience(user=student_user, experience_id=str(exp.id))

    api_client.force_authenticate(user=other_student)

    # 1. Toggle Helpful Vote
    res_vote = api_client.post(f"/api/v1/experiences/{exp.id}/helpful/")
    assert res_vote.status_code == 200
    assert res_vote.json()["data"]["has_voted"] is True
    assert res_vote.json()["data"]["helpful_votes_count"] == 1

    # Toggle off
    res_unvote = api_client.post(f"/api/v1/experiences/{exp.id}/helpful/")
    assert res_unvote.status_code == 200
    assert res_unvote.json()["data"]["has_voted"] is False
    assert res_unvote.json()["data"]["helpful_votes_count"] == 0

    # 2. Submit Report
    res_rep = api_client.post(
        f"/api/v1/experiences/{exp.id}/report/",
        {"reason": "inappropriate", "explanation": "Contains unsubstantiated claims"},
        format="json",
    )
    assert res_rep.status_code == 200
    assert res_rep.json()["data"]["status"] == "pending"

    exp.refresh_from_db()
    assert exp.reports_count == 1


@pytest.mark.django_db
def test_admin_moderation_operations(
    student_user, admin_user, api_client, sample_stages
):
    # Create flagged experience
    stages_flagged = list(sample_stages)
    stages_flagged[0]["additional_notes"] = "Recruiter phone was 9876543210"
    exp = ExperienceService.save_draft(
        user=student_user,
        data={
            "company_name": "Delta Solutions",
            "role": "DevOps Engineer",
            "experience_level": "Fresher",
            "overall_outcome": "selected",
            "stages": stages_flagged,
        },
    )
    ExperienceService.publish_experience(user=student_user, experience_id=str(exp.id))
    exp.refresh_from_db()
    assert exp.status == InterviewExperience.STATUS_PENDING_REVIEW

    # Admin Operations
    api_client.force_authenticate(user=admin_user)

    # 1. Admin Queue List
    res_q = api_client.get("/api/v1/admin-panel/experiences/?status=pending_review")
    assert res_q.status_code == 200
    assert any(item["id"] == str(exp.id) for item in res_q.json()["results"])

    # 2. Admin Approve
    res_app = api_client.post(
        f"/api/v1/admin-panel/experiences/{exp.id}/action/",
        {"action": "approve"},
        format="json",
    )
    assert res_app.status_code == 200
    exp.refresh_from_db()
    assert exp.status == InterviewExperience.STATUS_PUBLISHED

    # 3. Admin Suspend
    res_susp = api_client.post(
        f"/api/v1/admin-panel/experiences/{exp.id}/action/",
        {"action": "suspend", "reason": "Investigation ongoing"},
        format="json",
    )
    assert res_susp.status_code == 200
    exp.refresh_from_db()
    assert exp.is_hidden is True

    # 4. Admin Restore
    res_rest = api_client.post(
        f"/api/v1/admin-panel/experiences/{exp.id}/action/",
        {"action": "restore"},
        format="json",
    )
    assert res_rest.status_code == 200
    exp.refresh_from_db()
    assert exp.is_hidden is False
    assert exp.status == InterviewExperience.STATUS_PUBLISHED


@pytest.mark.django_db
def test_learn_topic_content_student_questions_integration(
    student_user, api_client, sample_stages
):
    api_client.force_authenticate(user=student_user)

    # Create Roadmap, Phase, Week, Topic
    roadmap = Roadmap.objects.create(
        user=student_user,
        role="Backend Engineer",
        experience_level="Fresher",
        language="Django",
        target_salary="₹6 - ₹10 LPA",
        status=Roadmap.STATUS_READY,
        is_active=True,
    )
    phase = RoadmapPhase.objects.create(
        roadmap=roadmap, phase_number=1, title="Foundation"
    )
    week = RoadmapWeek.objects.create(phase=phase, week_number=1, title="ORM Basics")
    topic = RoadmapTopicReference.objects.create(
        week=week,
        title="Django ORM Optimization",
        topic_slug="django-orm-optimization",
        order=1,
    )

    # Register an active StudentReportedQuestion matching Django
    StudentReportedQuestion.objects.create(
        source_experience=InterviewExperience.objects.create(
            author=student_user,
            company_name="Alpha Tech",
            role="Backend Engineer",
            overall_outcome="selected",
            status=InterviewExperience.STATUS_PUBLISHED,
        ),
        question_text="How do you benchmark Django queryset latency with explain analyze?",
        follow_up_text="What indexes would you add for composite filters?",
        role="Backend Engineer",
        technology="Django",
        topic_slug="django-orm-optimization",
        stage_type="Technical Round 1",
        salary_range="₹6 - ₹10 LPA",
        company_name="Alpha Tech",
        is_active=True,
    )

    # Request Topic Learning Content
    res = api_client.get(f"/api/v1/learning/topics/{topic.id}/content/")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "student_reported_questions" in data
    assert len(data["student_reported_questions"]) >= 1
    sr_q = data["student_reported_questions"][0]
    assert sr_q["provenance_label"] == "Student Reported Interview Question"
    assert "Django" in sr_q["question_text"]
