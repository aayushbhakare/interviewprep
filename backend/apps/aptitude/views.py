from rest_framework import status
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.aptitude.models import AptitudeTestConfig, AptitudeSession
from apps.aptitude.serializers import (
    AptitudeTestConfigSerializer,
    AptitudeSessionSummarySerializer,
)
from apps.aptitude.services.session_service import (
    check_fresher_eligibility,
    get_daily_attempt_usage,
    start_or_resume_aptitude_session,
    autosave_aptitude_answers,
    abandon_aptitude_session,
    submit_aptitude_session,
    get_session_taking_detail,
    get_session_results_detail,
)
from apps.aptitude.services.aptitude_bank_service import report_aptitude_question


def _enforce_verified_student(user):
    if not user.is_authenticated:
        raise PermissionDenied("Authentication required.")
    if not getattr(user, "is_verified", False):
        raise PermissionDenied("Email verification required.")


class AptitudeConfigView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Aptitude Practice Configuration",
        description="Retrieves active test structure, distribution, fresher eligibility status, and remaining daily attempts.",
        responses={200: dict},
    )
    def get(self, request):
        _enforce_verified_student(request.user)
        config = AptitudeTestConfig.get_active_config()
        config_data = AptitudeTestConfigSerializer(config).data

        # Determine fresher eligibility
        is_eligible = True
        ineligibility_reason = ""
        try:
            check_fresher_eligibility(request.user)
        except PermissionDenied as e:
            is_eligible = False
            ineligibility_reason = str(e)

        usage = get_daily_attempt_usage(request.user, config)

        return Response(
            {
                "status": "success",
                "data": {
                    "config": config_data,
                    "eligibility": {
                        "is_eligible": is_eligible,
                        "reason": ineligibility_reason,
                    },
                    "daily_usage": usage,
                },
            }
        )


class AptitudeStartSessionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Start or Resume Aptitude Test Session",
        description="Initiates a new test session or returns an active in-progress session. Enforces eligibility and 5-attempt daily limit.",
        request=None,
        responses={200: dict, 201: dict},
    )
    def post(self, request):
        _enforce_verified_student(request.user)
        session_type = request.data.get("session_type", AptitudeSession.TYPE_STANDALONE)
        session, is_resumed = start_or_resume_aptitude_session(
            request.user, session_type=session_type
        )
        data = get_session_taking_detail(session)
        return Response(
            {
                "status": "success",
                "message": "Resumed in-progress test session."
                if is_resumed
                else "Aptitude test started.",
                "data": {
                    "session_id": str(session.id),
                    "is_resumed": is_resumed,
                    "session": data,
                },
            },
            status=status.HTTP_200_OK if is_resumed else status.HTTP_201_CREATED,
        )


class AptitudeSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Aptitude Test Taking Details",
        description="Retrieves question palette, active time left, and options (omits correct answers).",
        responses={200: dict},
    )
    def get(self, request, session_id):
        _enforce_verified_student(request.user)
        session = AptitudeSession.objects.filter(
            id=session_id, student=request.user
        ).first()
        if not session:
            raise NotFound({"detail": "Aptitude session not found."})

        data = get_session_taking_detail(session)
        return Response({"status": "success", "data": data})


class AptitudeAutosaveView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Autosave Aptitude Answers",
        description="Debounced persistence of selected options during an active test session.",
        request=dict,
        responses={200: dict},
    )
    def post(self, request, session_id):
        _enforce_verified_student(request.user)
        answers_data = request.data.get("answers", [])
        result = autosave_aptitude_answers(str(session_id), request.user, answers_data)
        return Response({"status": "success", "data": result})


class AptitudeAbandonView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Abandon Aptitude Test Session",
        description="Discards current answers without consuming a daily attempt quota or generating a score.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, session_id):
        _enforce_verified_student(request.user)
        session = abandon_aptitude_session(str(session_id), request.user)
        return Response(
            {
                "status": "success",
                "message": "Aptitude session abandoned. Daily attempt allowance preserved.",
                "data": {"session_id": str(session.id), "status": session.status},
            }
        )


class AptitudeSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Submit Aptitude Test Session",
        description="Permanently locks answers, executes objective MCQ grading, and generates the scorecard.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, session_id):
        _enforce_verified_student(request.user)
        session = submit_aptitude_session(str(session_id), request.user)
        results = get_session_results_detail(session)
        return Response(
            {
                "status": "success",
                "message": "Aptitude test submitted successfully.",
                "data": results,
            }
        )


class AptitudeResultsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Aptitude Test Results & Review",
        description="Retrieves scorecard, correct answers, and step-by-step explanations for a submitted session.",
        responses={200: dict},
    )
    def get(self, request, session_id):
        _enforce_verified_student(request.user)
        session = AptitudeSession.objects.filter(
            id=session_id, student=request.user
        ).first()
        if not session:
            raise NotFound({"detail": "Aptitude session not found."})

        data = get_session_results_detail(session)
        return Response({"status": "success", "data": data})


class AptitudeHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Student Aptitude Practice History",
        description="Retrieves chronological list of all past standalone aptitude sessions.",
        responses={200: dict},
    )
    def get(self, request):
        _enforce_verified_student(request.user)
        sessions = AptitudeSession.objects.filter(
            student=request.user,
            session_type=AptitudeSession.TYPE_STANDALONE,
        ).order_by("-created_at")

        serializer = AptitudeSessionSummarySerializer(sessions, many=True)
        return Response({"status": "success", "data": {"sessions": serializer.data}})


class AptitudeReportView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Report Aptitude Question Issue",
        description="Report an ambiguous option, wrong answer, or typo in an aptitude question.",
        request=dict,
        responses={201: dict},
    )
    def post(self, request):
        _enforce_verified_student(request.user)
        question_id = request.data.get("question_id")
        reason = request.data.get("reason", "incorrect_answer")
        description = request.data.get("description", "")

        if not question_id:
            raise ValidationError({"detail": "question_id is required."})

        report, created = report_aptitude_question(
            student=request.user,
            question_id=str(question_id),
            reason=reason,
            description=description,
        )

        return Response(
            {
                "status": "success",
                "message": "Report submitted."
                if created
                else "Duplicate report acknowledged.",
                "data": {"report_id": str(report.id), "status": report.status},
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
