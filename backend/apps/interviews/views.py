import logging
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administration.models import AdminActivityLog
from apps.ai_services.models import AIUsageRecord
from apps.interviews.models import InterviewConfig, InterviewSession
from apps.interviews.serializers import (
    AdminInterviewConfigSerializer,
    InterviewEligibilityResponseSerializer,
    InterviewHistoryItemSerializer,
    InterviewSessionCreateSerializer,
    InterviewSessionDetailSerializer,
    InterviewSetupPrepopulateResponseSerializer,
    InterviewTurnInputSerializer,
    InterviewTurnResponseSerializer,
)
from apps.interviews.services.interview_session_service import (
    abandon_interview_session,
    check_interview_eligibility,
    complete_and_evaluate_session,
    complete_mixed_aptitude_stage,
    create_interview_session,
    get_prepopulated_setup_data,
    get_session_detail_dict,
    process_interview_turn,
)

logger = logging.getLogger(__name__)


class InterviewEligibilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="get_interview_eligibility",
        responses={200: InterviewEligibilityResponseSerializer},
        summary="Check cooling periods and active sessions",
    )
    def get(self, request):
        data = check_interview_eligibility(request.user)
        return Response({"status": "success", "data": data})


class InterviewSetupPrepopulateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="get_interview_setup_prepopulate",
        responses={200: InterviewSetupPrepopulateResponseSerializer},
        summary="Retrieve prepopulated roadmap and resume data for interview setup",
    )
    def get(self, request):
        data = get_prepopulated_setup_data(request.user)
        return Response({"status": "success", "data": data})


class InterviewStartSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="start_interview_session",
        request=InterviewSessionCreateSerializer,
        responses={201: InterviewSessionDetailSerializer},
        summary="Start or resume an interview session",
    )
    def post(self, request):
        serializer = InterviewSessionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = create_interview_session(request.user, serializer.validated_data)
        detail = get_session_detail_dict(session)
        return Response({"status": "success", "data": detail}, status=status.HTTP_201_CREATED)


class InterviewSessionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="get_interview_session_detail",
        responses={200: InterviewSessionDetailSerializer},
        summary="Get active interview session state and conversation",
    )
    def get(self, request, session_id):
        session = get_object_or_404(InterviewSession, id=session_id, student=request.user)
        detail = get_session_detail_dict(session)
        return Response({"status": "success", "data": detail})


class InterviewTurnView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="submit_interview_turn",
        request=InterviewTurnInputSerializer,
        responses={200: InterviewTurnResponseSerializer},
        summary="Submit student voice response and receive interviewer response",
    )
    def post(self, request, session_id):
        serializer = InterviewTurnInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        speech_text = serializer.validated_data["speech_text"]
        turn_result = process_interview_turn(session_id, request.user, speech_text)
        return Response({"status": "success", "data": turn_result})


class InterviewCompleteAptitudeStageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="complete_mixed_aptitude_stage",
        request=None,
        responses={200: dict},
        summary="Evaluate mixed recruitment aptitude stage and advance to Round 2 or abort as FAIL",
    )
    def post(self, request, session_id):
        res = complete_mixed_aptitude_stage(session_id, request.user)
        return Response({"status": "success", "data": res})


class InterviewEvaluateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="evaluate_interview_session",
        request=None,
        responses={200: InterviewSessionDetailSerializer},
        summary="Evaluate completed interview session and compile feedback",
    )
    def post(self, request, session_id):
        session = get_object_or_404(InterviewSession, id=session_id, student=request.user)
        if session.status == InterviewSession.STATUS_IN_PROGRESS:
            complete_and_evaluate_session(session)
        detail = get_session_detail_dict(session)
        return Response({"status": "success", "data": detail})


class InterviewResultsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="get_interview_results",
        responses={200: dict},
        summary="Get final PASS/FAIL result and structured feedback",
    )
    def get(self, request, session_id):
        session = get_object_or_404(InterviewSession, id=session_id, student=request.user)
        detail = get_session_detail_dict(session)
        return Response(
            {
                "status": "success",
                "data": {
                    "session_id": str(session.id),
                    "interview_type": session.interview_type,
                    "final_result": session.final_result,
                    "role": session.role,
                    "salary_range": session.salary_range,
                    "experience_level": session.experience_level,
                    "cooling_period_until": detail.get("cooling_period_until"),
                    "completed_at": detail.get("completed_at"),
                    "overall_feedback": detail.get("overall_feedback", {}),
                    "rounds": detail.get("rounds", []),
                },
            }
        )


class InterviewAbandonView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="abandon_interview_session",
        request=None,
        responses={200: dict},
        summary="Abandon an in-progress interview session without penalty",
    )
    def post(self, request, session_id):
        session = abandon_interview_session(session_id, request.user)
        return Response(
            {
                "status": "success",
                "message": "Interview session abandoned.",
                "data": {"session_id": str(session.id), "status": session.status},
            }
        )


class InterviewHistoryListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="list_interview_history",
        responses={200: InterviewHistoryItemSerializer(many=True)},
        summary="List student's historical interview sessions",
    )
    def get(self, request):
        qs = InterviewSession.objects.filter(student=request.user).order_by("-created_at")
        itype = request.query_params.get("type")
        if itype:
            qs = qs.filter(interview_type=itype)
        serializer = InterviewHistoryItemSerializer(qs, many=True)
        return Response({"status": "success", "data": serializer.data})


class InterviewHistoryDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="get_interview_history_detail",
        responses={200: InterviewSessionDetailSerializer},
        summary="Retrieve complete details of a historical interview session",
    )
    def get(self, request, session_id):
        session = get_object_or_404(InterviewSession, id=session_id, student=request.user)
        detail = get_session_detail_dict(session)
        return Response({"status": "success", "data": detail})


# ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────


class AdminInterviewConfigView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(
        operation_id="admin_get_interview_config",
        responses={200: AdminInterviewConfigSerializer},
        summary="Admin: Get global interview rules and cooling hours",
    )
    def get(self, request):
        config = InterviewConfig.get_active_config()
        serializer = AdminInterviewConfigSerializer(config)
        return Response({"status": "success", "data": serializer.data})

    @extend_schema(
        operation_id="admin_update_interview_config",
        request=AdminInterviewConfigSerializer,
        responses={200: AdminInterviewConfigSerializer},
        summary="Admin: Update global interview rules and cooling hours",
    )
    def patch(self, request):
        config = InterviewConfig.get_active_config()
        serializer = AdminInterviewConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Audit log in AdminActivityLog
        AdminActivityLog.objects.create(
            actor=request.user,
            action="update_interview_config",
            resource_type="InterviewConfig",
            resource_id=str(config.id),
            details=serializer.validated_data,
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return Response({"status": "success", "data": serializer.data})


class AdminInterviewAnalyticsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(
        operation_id="admin_get_interview_analytics",
        responses={200: dict},
        summary="Admin: Get interview sessions analytics, pass rates, and AI usage",
    )
    def get(self, request):
        total_sessions = InterviewSession.objects.count()
        completed_sessions = InterviewSession.objects.filter(status=InterviewSession.STATUS_COMPLETED).count()
        pass_count = InterviewSession.objects.filter(final_result=InterviewSession.RESULT_PASS).count()
        fail_count = InterviewSession.objects.filter(final_result=InterviewSession.RESULT_FAIL).count()
        abandoned_count = InterviewSession.objects.filter(status=InterviewSession.STATUS_ABANDONED).count()

        by_type = (
            InterviewSession.objects.values("interview_type")
            .annotate(
                total=Count("id"),
                passed=Count("id", filter=Q(final_result=InterviewSession.RESULT_PASS)),
                failed=Count("id", filter=Q(final_result=InterviewSession.RESULT_FAIL)),
            )
            .order_by("interview_type")
        )

        # AI Usage stats for interview features
        ai_records = AIUsageRecord.objects.filter(feature__startswith="interview_")
        total_ai_tokens = sum(r.total_tokens for r in ai_records)
        total_ai_cost = sum(float(r.estimated_cost_usd) for r in ai_records)

        return Response(
            {
                "status": "success",
                "data": {
                    "total_sessions": total_sessions,
                    "completed_sessions": completed_sessions,
                    "pass_count": pass_count,
                    "fail_count": fail_count,
                    "abandoned_count": abandoned_count,
                    "overall_pass_rate": round((pass_count / max(1, completed_sessions)) * 100, 1),
                    "distribution_by_type": list(by_type),
                    "ai_telemetry": {
                        "total_tokens": total_ai_tokens,
                        "total_cost_usd": round(total_ai_cost, 4),
                        "total_calls": ai_records.count(),
                    },
                },
            }
        )
