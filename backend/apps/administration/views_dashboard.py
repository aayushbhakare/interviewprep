from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.accounts.models import User
from apps.administration.permissions import IsPlatformAdmin
from apps.learning.models import Roadmap, RoadmapPracticeTask
from apps.quizzes.models import QuizAttempt
from apps.questions.models import Question, QuestionReport
from apps.aptitude.models import AptitudeSession, AptitudeQuestion, AptitudeQuestionReport
from apps.interviews.models import InterviewSession
from apps.experiences.models import InterviewExperience, ExperienceReport
from apps.common.models import ProcessingJob


class AdminDashboardOverviewView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Admin Dashboard Platform Overview",
        description="Consolidates high-level platform metrics and actionable operational attention indicators.",
        responses={200: dict},
    )
    def get(self, request):
        now = timezone.now()
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)

        # 1. Platform Overview Metrics
        student_qs = User.objects.filter(is_staff=False)
        total_students = student_qs.count()
        verified_students = student_qs.filter(is_verified=True).count()
        new_students_7d = student_qs.filter(created_at__gte=seven_days_ago).count()
        active_students_30d = student_qs.filter(
            last_login__gte=thirty_days_ago
        ).count()

        overview = {
            "total_students": total_students,
            "verified_students": verified_students,
            "new_students_7d": new_students_7d,
            "active_students_30d": active_students_30d,
            "roadmaps_learning": Roadmap.objects.count(),
            "roadmaps_practice": RoadmapPracticeTask.objects.count(),
            "quizzes_attempts": QuizAttempt.objects.count(),
            "aptitude_sessions": AptitudeSession.objects.count(),
            "interviews_technical": InterviewSession.objects.filter(
                interview_type="technical"
            ).count(),
            "interviews_hr": InterviewSession.objects.filter(
                interview_type="hr"
            ).count(),
            "interviews_mixed": InterviewSession.objects.filter(
                interview_type="mixed"
            ).count(),
            "interviews_total": InterviewSession.objects.count(),
            "experiences_published": InterviewExperience.objects.filter(
                status="published"
            ).count(),
            "experiences_total": InterviewExperience.objects.count(),
        }

        # 2. Attention Required Indicators
        pending_experiences = InterviewExperience.objects.filter(
            status="pending_review"
        ).count()
        reported_experiences = ExperienceReport.objects.filter(
            status="pending"
        ).count()
        suspended_tech_questions = Question.objects.filter(status="suspended").count()
        unresolved_tech_reports = QuestionReport.objects.filter(
            status="pending"
        ).count()
        suspended_aptitude_questions = AptitudeQuestion.objects.filter(
            status="suspended"
        ).count()
        unresolved_aptitude_reports = AptitudeQuestionReport.objects.filter(
            status="pending"
        ).count()
        failed_jobs = ProcessingJob.objects.filter(status="failed").count()

        attention_required = [
            {
                "id": "pending_experiences",
                "label": "Experiences Awaiting Moderation",
                "count": pending_experiences,
                "severity": "high" if pending_experiences > 0 else "neutral",
                "link": "/admin/experiences?status=pending_review",
            },
            {
                "id": "reported_experiences",
                "label": "Unresolved Community Experience Reports",
                "count": reported_experiences,
                "severity": "high" if reported_experiences > 0 else "neutral",
                "link": "/admin/experiences?tab=reports",
            },
            {
                "id": "suspended_tech_questions",
                "label": "Suspended Technical Questions",
                "count": suspended_tech_questions,
                "severity": "medium" if suspended_tech_questions > 0 else "neutral",
                "link": "/admin/question-bank?status=suspended",
            },
            {
                "id": "unresolved_tech_reports",
                "label": "Unresolved Technical Question Reports",
                "count": unresolved_tech_reports,
                "severity": "medium" if unresolved_tech_reports > 0 else "neutral",
                "link": "/admin/question-bank?tab=reports",
            },
            {
                "id": "suspended_aptitude_questions",
                "label": "Suspended Aptitude Questions",
                "count": suspended_aptitude_questions,
                "severity": "medium" if suspended_aptitude_questions > 0 else "neutral",
                "link": "/admin/aptitude?status=suspended",
            },
            {
                "id": "unresolved_aptitude_reports",
                "label": "Unresolved Aptitude Question Reports",
                "count": unresolved_aptitude_reports,
                "severity": "medium" if unresolved_aptitude_reports > 0 else "neutral",
                "link": "/admin/aptitude?tab=reports",
            },
            {
                "id": "failed_jobs",
                "label": "Failed Background Processing Jobs",
                "count": failed_jobs,
                "severity": "high" if failed_jobs > 0 else "neutral",
                "link": "/admin/monitoring?status=failed",
            },
        ]

        return Response(
            {
                "status": "success",
                "data": {
                    "overview": overview,
                    "attention_required": attention_required,
                    "server_time": now.isoformat(),
                },
            }
        )
