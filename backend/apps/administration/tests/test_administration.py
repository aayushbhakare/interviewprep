import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User, AdminInvitation
from apps.administration.models import AdminActivityLog
from apps.content.models import TopicContent
from apps.common.models import ProcessingJob
from apps.learning.models import (
    Roadmap,
    RoadmapPhase,
    RoadmapWeek,
    RoadmapTopicReference,
    TopicProgress,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        email="superadmin@interviewprep.local",
        password="AdminPass123!",
        full_name="Platform SuperAdmin",
        is_staff=True,
        is_verified=True,
        is_active=True,
        is_admin_2fa_enabled=True,
    )
    return user


@pytest.fixture
def second_admin_user(db):
    user = User.objects.create_user(
        email="secondadmin@interviewprep.local",
        password="AdminPass123!",
        full_name="Second Admin",
        is_staff=True,
        is_verified=True,
        is_active=True,
    )
    return user


@pytest.fixture
def student_user(db):
    user = User.objects.create_user(
        email="student.test@example.com",
        password="StudentPass123!",
        full_name="Jane Student",
        is_staff=False,
        is_verified=True,
        is_active=True,
    )
    return user


@pytest.mark.django_db
class TestAdminSecurityAndAccess:
    def test_student_cannot_access_admin_endpoints(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)

        res = api_client.get("/api/v1/admin-panel/dashboard/")
        assert res.status_code == status.HTTP_403_FORBIDDEN

        res = api_client.get("/api/v1/admin-panel/students/")
        assert res.status_code == status.HTTP_403_FORBIDDEN

        res = api_client.get("/api/v1/admin-panel/settings/")
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_account_listing_and_deactivation_guard(
        self, api_client, admin_user, second_admin_user
    ):
        api_client.force_authenticate(user=admin_user)

        # List admins
        res = api_client.get("/api/v1/admin-panel/admins/")
        assert res.status_code == status.HTTP_200_OK
        assert len(res.data["data"]) == 2

        # Deactivate second admin
        res_deact = api_client.post(
            f"/api/v1/admin-panel/admins/{second_admin_user.id}/deactivate/"
        )
        assert res_deact.status_code == status.HTTP_200_OK
        second_admin_user.refresh_from_db()
        assert second_admin_user.is_active is False

        # Guard: Attempt to deactivate the last remaining active admin must fail
        res_fail = api_client.post(
            f"/api/v1/admin-panel/admins/{admin_user.id}/deactivate/"
        )
        assert res_fail.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cannot deactivate the last active" in res_fail.data["detail"]

        # Reactivate second admin
        res_react = api_client.post(
            f"/api/v1/admin-panel/admins/{second_admin_user.id}/reactivate/"
        )
        assert res_react.status_code == status.HTTP_200_OK
        second_admin_user.refresh_from_db()
        assert second_admin_user.is_active is True

    def test_invitation_listing_and_revocation(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)

        # Create invitation
        inv = AdminInvitation.objects.create(
            email="candidate.admin@example.com",
            invited_by=admin_user,
            token_hash="fakehash123",
            expires_at=timezone.now() + timezone.timedelta(days=7),
            is_accepted=False,
            is_revoked=False,
        )

        res = api_client.get("/api/v1/admin-panel/invitations/list/")
        assert res.status_code == status.HTTP_200_OK
        assert len(res.data["data"]) >= 1

        # Revoke invitation
        res_rev = api_client.post(
            f"/api/v1/admin-panel/invitations/{inv.id}/revoke/"
        )
        assert res_rev.status_code == status.HTTP_200_OK
        inv.refresh_from_db()
        assert inv.is_revoked is True


@pytest.mark.django_db
class TestAdminDashboardAndOperations:
    def test_dashboard_overview_metrics(self, api_client, admin_user, student_user):
        api_client.force_authenticate(user=admin_user)

        res = api_client.get("/api/v1/admin-panel/dashboard/")
        assert res.status_code == status.HTTP_200_OK
        data = res.data["data"]

        assert "overview" in data
        assert "attention_required" in data
        assert data["overview"]["total_students"] >= 1
        assert data["overview"]["verified_students"] >= 1
        assert len(data["attention_required"]) >= 5


@pytest.mark.django_db
class TestStudentManagement:
    def test_student_list_search_and_detail(self, api_client, admin_user, student_user):
        api_client.force_authenticate(user=admin_user)

        # List with search
        res = api_client.get("/api/v1/admin-panel/students/?search=Jane")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["count"] >= 1
        assert res.data["results"][0]["email"] == student_user.email

        # Detail deep-dive
        res_detail = api_client.get(
            f"/api/v1/admin-panel/students/{student_user.id}/"
        )
        assert res_detail.status_code == status.HTTP_200_OK
        assert res_detail.data["data"]["email"] == student_user.email
        assert "activity" in res_detail.data["data"]

    def test_student_suspension_and_enforcement(
        self, api_client, admin_user, student_user
    ):
        api_client.force_authenticate(user=admin_user)

        # Suspend student
        res = api_client.post(
            f"/api/v1/admin-panel/students/{student_user.id}/suspend/",
            {"reason": "Academic dishonesty during assessment"},
            format="json",
        )
        assert res.status_code == status.HTTP_200_OK
        student_user.refresh_from_db()
        assert student_user.is_suspended is True

        # Audit log verification
        log = AdminActivityLog.objects.filter(
            action="student_suspended", resource_id=str(student_user.id)
        ).first()
        assert log is not None
        assert "Academic dishonesty" in log.details.get("reason", "")

        # Verify suspended student is blocked by middleware
        api_client.force_authenticate(user=student_user)
        blocked_res = api_client.get("/api/v1/learning/roadmaps/")
        assert blocked_res.status_code == status.HTTP_403_FORBIDDEN
        assert "suspended" in blocked_res.json()["message"].lower()

        # Reactivate student
        api_client.force_authenticate(user=admin_user)
        res_react = api_client.post(
            f"/api/v1/admin-panel/students/{student_user.id}/reactivate/"
        )
        assert res_react.status_code == status.HTTP_200_OK
        student_user.refresh_from_db()
        assert student_user.is_suspended is False


@pytest.mark.django_db
class TestLearningContentManagement:
    def test_topic_content_browsing_versioning_and_progress_preservation(
        self, api_client, admin_user, student_user
    ):
        api_client.force_authenticate(user=admin_user)

        # Create topic content v1
        topic_v1 = TopicContent.objects.create(
            slug="django-orm-indexing",
            topic_name="Django ORM Indexing & Query Optimization",
            technology="Django",
            version=1,
            learning_objectives=["Understand B-tree and Hash indexes"],
            concept_explanation="Indexes improve query speed at the cost of write performance.",
            is_published=True,
        )

        # Create student roadmap referencing this topic
        roadmap = Roadmap.objects.create(
            user=student_user,
            role="Backend Engineer",
            experience_level="1-3",
            target_salary="15-25 LPA",
            language="Python",
            status=Roadmap.STATUS_READY,
        )
        phase = RoadmapPhase.objects.create(
            roadmap=roadmap, phase_number=1, title="Foundations"
        )
        week = RoadmapWeek.objects.create(
            phase=phase, week_number=1, title="Databases"
        )
        topic_ref = RoadmapTopicReference.objects.create(
            week=week,
            topic_slug="django-orm-indexing",
            title="Django ORM Indexing",
            order=1,
        )
        progress = TopicProgress.objects.create(
            roadmap=roadmap,
            topic=topic_ref,
            status=TopicProgress.STATUS_COMPLETED,
            completed_at=timezone.now(),
        )

        # Admin browses topics
        res = api_client.get("/api/v1/admin-panel/learning/topics/?technology=Django")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["count"] >= 1

        # Admin creates new version (v2) of the topic content
        res_v2 = api_client.post(
            f"/api/v1/admin-panel/learning/topics/{topic_v1.id}/version/",
            {
                "topic_name": "Django ORM Indexing & Advanced Query Optimization",
                "concept_explanation": "Expanded explanation covering partial indexes and BRIN.",
                "learning_objectives": ["B-tree", "BRIN", "Query profiling"],
            },
            format="json",
        )
        assert res_v2.status_code == status.HTTP_201_CREATED
        assert res_v2.data["data"]["version"] == 2

        # Verify Student Progress was PRESERVED
        progress.refresh_from_db()
        assert progress.status == TopicProgress.STATUS_COMPLETED


@pytest.mark.django_db
class TestPlatformSettingsAndAI:
    def test_settings_retrieval_and_validation(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)

        res = api_client.get("/api/v1/admin-panel/settings/")
        assert res.status_code == status.HTTP_200_OK
        assert "aptitude_config" in res.data["data"]

        # Invalid aptitude update: categories don't sum to 45
        invalid_payload = {
            "value": {
                "total_questions": 45,
                "categories": {"quantitative": 10, "logical": 10, "verbal": 10},  # sums to 30
                "mixed_cutoff_percentage": 60.0,
            }
        }
        res_fail = api_client.put(
            "/api/v1/admin-panel/settings/aptitude_config/",
            invalid_payload,
            format="json",
        )
        assert res_fail.status_code == status.HTTP_400_BAD_REQUEST

        # Valid aptitude update
        valid_payload = {
            "value": {
                "total_questions": 45,
                "categories": {"quantitative": 15, "logical": 15, "verbal": 15},
                "difficulties": {"Easy": 15, "Medium": 20, "Hard": 10},
                "standalone_daily_limit": 5,
                "test_duration_minutes": 60,
                "mixed_cutoff_percentage": 65.0,
            }
        }
        res_ok = api_client.put(
            "/api/v1/admin-panel/settings/aptitude_config/",
            valid_payload,
            format="json",
        )
        assert res_ok.status_code == status.HTTP_200_OK

    def test_ai_models_configuration(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)

        res = api_client.get("/api/v1/admin-panel/ai-models/")
        assert res.status_code == status.HTTP_200_OK
        assert len(res.data["data"]["services"]) >= 8

        # Update service routing
        res_update = api_client.put(
            "/api/v1/admin-panel/ai-models/quiz_evaluation/",
            {
                "provider": "deterministic",
                "model": "eval-engine-v2",
                "fallback_provider": "gemini",
            },
            format="json",
        )
        assert res_update.status_code == status.HTTP_200_OK
        assert res_update.data["data"]["model"] == "eval-engine-v2"


@pytest.mark.django_db
class TestMonitoringAndMaintenance:
    def test_monitoring_diagnostics_and_job_retry(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)

        # Create failed job
        job = ProcessingJob.objects.create(
            job_type="weekly_quiz_generation",
            status=ProcessingJob.STATUS_FAILED,
            error_message="Connection reset by peer",
        )

        res = api_client.get("/api/v1/admin-panel/monitoring/")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["data"]["health"]["database_status"] == "healthy"
        assert "₹" in res.data["data"]["ai_telemetry"]["estimated_cost_inr"]

        # Retry failed job
        res_retry = api_client.post(
            f"/api/v1/admin-panel/monitoring/jobs/{job.id}/retry/"
        )
        assert res_retry.status_code == status.HTTP_200_OK
        job.refresh_from_db()
        assert job.status == ProcessingJob.STATUS_QUEUED
        assert job.retry_count == 1

    def test_activity_logs_retrieval(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)

        AdminActivityLog.objects.create(
            actor=admin_user,
            action="test_action",
            resource_type="system",
            details={"notes": "Testing audit log"},
        )

        res = api_client.get("/api/v1/admin-panel/activity-logs/?action=test_action")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["count"] >= 1

    def test_maintenance_middleware_enforcement(
        self, api_client, admin_user, student_user
    ):
        api_client.force_authenticate(user=admin_user)

        # 1. Enable module maintenance on Aptitude
        res_maint = api_client.post(
            "/api/v1/admin-panel/maintenance/",
            {
                "modules": {
                    "aptitude": {
                        "enabled": True,
                        "message": "Aptitude engine is undergoing scheduled tuning.",
                    }
                }
            },
            format="json",
        )
        assert res_maint.status_code == status.HTTP_200_OK

        # 2. Student attempting to start an aptitude session is rejected with 503
        api_client.force_authenticate(user=student_user)
        res_blocked = api_client.post("/api/v1/aptitude/sessions/start/")
        assert res_blocked.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert "scheduled tuning" in res_blocked.json()["message"]

        # 3. Staff administrator is exempt from maintenance mode
        api_client.force_authenticate(user=admin_user)
        res_staff = api_client.post("/api/v1/aptitude/sessions/start/")
        assert res_staff.status_code != status.HTTP_503_SERVICE_UNAVAILABLE

        # 4. Disable maintenance
        api_client.post(
            "/api/v1/admin-panel/maintenance/",
            {"modules": {"aptitude": {"enabled": False}}},
            format="json",
        )
