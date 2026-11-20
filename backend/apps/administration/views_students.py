from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema

from apps.accounts.models import User
from apps.administration.permissions import IsPlatformAdmin
from apps.administration.services.activity_log_service import log_admin_activity
from apps.learning.models import Roadmap, TopicProgress, PracticeTaskProgress
from apps.quizzes.models import QuizAttempt
from apps.aptitude.models import AptitudeSession
from apps.interviews.models import InterviewSession
from apps.experiences.models import InterviewExperience


class StudentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminStudentListView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        operation_id="admin_student_list",
        summary="List Students",
        description="Search, filter, and paginate through registered student accounts.",
        responses={200: dict},
    )
    def get(self, request):
        qs = (
            User.objects.filter(is_staff=False)
            .select_related("profile")
            .order_by("-created_at")
        )

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) | Q(email__icontains=search)
            )

        verification = request.query_params.get("verified", "").strip().lower()
        if verification == "true":
            qs = qs.filter(is_verified=True)
        elif verification == "false":
            qs = qs.filter(is_verified=False)

        account_status = request.query_params.get("status", "").strip().lower()
        if account_status == "suspended":
            qs = qs.filter(is_suspended=True)
        elif account_status == "active":
            qs = qs.filter(is_suspended=False, is_active=True)

        paginator = StudentPagination()
        page = paginator.paginate_queryset(qs, request)

        results = []
        for u in page:
            results.append(
                {
                    "id": str(u.id),
                    "full_name": u.full_name,
                    "email": u.email,
                    "is_verified": u.is_verified,
                    "is_active": u.is_active,
                    "is_suspended": getattr(u, "is_suspended", False),
                    "suspension_reason": getattr(u, "suspension_reason", ""),
                    "target_role": getattr(u.profile, "target_role", None)
                    if hasattr(u, "profile")
                    else None,
                    "created_at": u.created_at,
                    "last_login": u.last_login,
                }
            )

        return paginator.get_paginated_response(results)


class AdminStudentDetailView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        operation_id="admin_student_detail",
        summary="Student Profile & Activity Deep-Dive",
        description="Retrieves a complete non-sensitive operational overview of a student's learning, quiz, aptitude, interview, and experience activities.",
        responses={200: dict},
    )
    def get(self, request, student_id):
        student = get_object_or_404(User, id=student_id, is_staff=False)

        # Roadmap Summaries
        active_roadmap = (
            Roadmap.objects.filter(user=student, is_active=True)
            .prefetch_related("topic_progresses", "practice_progresses")
            .first()
        )
        roadmap_summary = None
        if active_roadmap:
            total_topics = TopicProgress.objects.filter(
                roadmap=active_roadmap
            ).count()
            completed_topics = TopicProgress.objects.filter(
                roadmap=active_roadmap, status=TopicProgress.STATUS_COMPLETED
            ).count()
            total_tasks = PracticeTaskProgress.objects.filter(
                roadmap=active_roadmap
            ).count()
            completed_tasks = PracticeTaskProgress.objects.filter(
                roadmap=active_roadmap,
                status=PracticeTaskProgress.STATUS_COMPLETED,
            ).count()
            roadmap_summary = {
                "id": str(active_roadmap.id),
                "role": active_roadmap.role,
                "experience_level": active_roadmap.experience_level,
                "target_salary": active_roadmap.target_salary,
                "language": active_roadmap.language,
                "total_topics": total_topics,
                "completed_topics": completed_topics,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "progress_percentage": round(
                    (completed_topics / total_topics * 100), 1
                )
                if total_topics > 0
                else 0,
            }

        # Activity Summaries
        quiz_attempts = QuizAttempt.objects.filter(student=student)
        quiz_count = quiz_attempts.count()
        quiz_avg_score = quiz_attempts.aggregate(Avg("score"))["score__avg"]

        aptitude_sessions = AptitudeSession.objects.filter(student=student)
        aptitude_count = aptitude_sessions.count()
        aptitude_avg_score = aptitude_sessions.aggregate(Avg("score"))["score__avg"]

        interviews = InterviewSession.objects.filter(student=student)
        interview_count = interviews.count()
        interviews_cleared = interviews.filter(
            status=InterviewSession.STATUS_COMPLETED,
            final_result=InterviewSession.RESULT_PASS,
        ).count()

        experiences = InterviewExperience.objects.filter(author=student)
        experiences_published = experiences.filter(status="published").count()

        return Response(
            {
                "status": "success",
                "data": {
                    "id": str(student.id),
                    "full_name": student.full_name,
                    "email": student.email,
                    "is_verified": student.is_verified,
                    "is_active": student.is_active,
                    "is_suspended": getattr(student, "is_suspended", False),
                    "suspension_reason": getattr(
                        student, "suspension_reason", ""
                    ),
                    "created_at": student.created_at,
                    "last_login": student.last_login,
                    "profile": {
                        "target_role": getattr(student.profile, "target_role", None)
                        if hasattr(student, "profile")
                        else None,
                        "experience_level": getattr(
                            student.profile, "experience_level", None
                        )
                        if hasattr(student, "profile")
                        else None,
                        "target_salary": getattr(
                            student.profile, "target_salary", None
                        )
                        if hasattr(student, "profile")
                        else None,
                        "current_resume_version": getattr(
                            student.profile, "current_resume_version", 0
                        )
                        if hasattr(student, "profile")
                        else 0,
                    },
                    "roadmap": roadmap_summary,
                    "activity": {
                        "quiz_attempts_count": quiz_count,
                        "quiz_average_score": round(quiz_avg_score, 1)
                        if quiz_avg_score is not None
                        else None,
                        "aptitude_sessions_count": aptitude_count,
                        "aptitude_average_score": round(aptitude_avg_score, 1)
                        if aptitude_avg_score is not None
                        else None,
                        "interviews_count": interview_count,
                        "interviews_cleared_count": interviews_cleared,
                        "experiences_total_count": experiences.count(),
                        "experiences_published_count": experiences_published,
                    },
                },
            }
        )


class AdminStudentSuspendView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Suspend Student Account",
        description="Blocks the student from protected platform operations while preserving performance records.",
        request={"application/json": {"properties": {"reason": {"type": "string"}}}},
        responses={200: dict},
    )
    def post(self, request, student_id):
        student = get_object_or_404(User, id=student_id, is_staff=False)
        reason = request.data.get("reason", "").strip() or "Violation of platform integrity policies"

        student.is_suspended = True
        student.suspension_reason = reason
        student.save(update_fields=["is_suspended", "suspension_reason"])

        log_admin_activity(
            actor=request.user,
            action="student_suspended",
            resource_type="user",
            resource_id=str(student.id),
            details={"email": student.email, "reason": reason},
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"Student account {student.email} has been suspended.",
                "data": {
                    "id": str(student.id),
                    "is_suspended": True,
                    "suspension_reason": student.suspension_reason,
                },
            }
        )


class AdminStudentReactivateView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Reactivate Student Account",
        description="Restores platform access for a previously suspended student.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, student_id):
        student = get_object_or_404(User, id=student_id, is_staff=False)

        student.is_suspended = False
        student.suspension_reason = ""
        student.is_active = True
        student.save(update_fields=["is_suspended", "suspension_reason", "is_active"])

        log_admin_activity(
            actor=request.user,
            action="student_reactivated",
            resource_type="user",
            resource_id=str(student.id),
            details={"email": student.email},
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"Student account {student.email} has been reactivated.",
                "data": {
                    "id": str(student.id),
                    "is_suspended": False,
                    "suspension_reason": "",
                },
            }
        )
