from rest_framework import status
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.aptitude.models import (
    AptitudeQuestion,
    AptitudeQuestionReport,
    AptitudeTestConfig,
)
from apps.aptitude.serializers import (
    AptitudeQuestionSerializer,
    AptitudeQuestionVersionSerializer,
    AptitudeQuestionReportSerializer,
    AptitudeTestConfigSerializer,
)
from apps.aptitude.services.aptitude_bank_service import (
    admin_create_aptitude_question,
    admin_publish_new_version,
    admin_update_question_status,
    admin_resolve_report,
)
from apps.administration.models import AdminActivityLog


def _enforce_staff(user):
    if not user.is_authenticated or not user.is_staff:
        raise PermissionDenied("Administrator privileges required.")


class AdminAptitudeQuestionListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_list_aptitude_questions",
        summary="Admin - List & Search Aptitude Questions",
        description="Filter aptitude questions by category, difficulty, status, or search query.",
        parameters=[
            OpenApiParameter("category", str, description="Filter by category"),
            OpenApiParameter("difficulty", str, description="Filter by difficulty"),
            OpenApiParameter("status", str, description="Filter by status"),
            OpenApiParameter(
                "search", str, description="Search question text or topic"
            ),
        ],
        responses={200: dict},
    )
    def get(self, request):
        _enforce_staff(request.user)
        qs = AptitudeQuestion.objects.all().order_by("-created_at")

        cat = request.query_params.get("category")
        diff = request.query_params.get("difficulty")
        st = request.query_params.get("status")
        search = request.query_params.get("search")

        if cat:
            qs = qs.filter(category=cat)
        if diff:
            qs = qs.filter(difficulty=diff)
        if st:
            qs = qs.filter(status=st)
        if search:
            qs = qs.filter(question_text__icontains=search) | qs.filter(
                topic__icontains=search
            )

        serializer = AptitudeQuestionSerializer(qs, many=True)
        stats = {
            "total_questions": AptitudeQuestion.objects.count(),
            "approved": AptitudeQuestion.objects.filter(
                status=AptitudeQuestion.STATUS_APPROVED
            ).count(),
            "suspended": AptitudeQuestion.objects.filter(
                status=AptitudeQuestion.STATUS_SUSPENDED
            ).count(),
            "inactive": AptitudeQuestion.objects.filter(
                status=AptitudeQuestion.STATUS_INACTIVE
            ).count(),
        }
        return Response(
            {
                "status": "success",
                "data": {"stats": stats, "questions": serializer.data},
            }
        )

    @extend_schema(
        summary="Admin - Create Aptitude Question",
        description="Create a new multiple-choice question in the shared aptitude bank.",
        request=dict,
        responses={201: dict},
    )
    def post(self, request):
        _enforce_staff(request.user)
        q_obj, v_obj = admin_create_aptitude_question(request.user, request.data)
        return Response(
            {
                "status": "success",
                "message": "Aptitude question created successfully.",
                "data": AptitudeQuestionSerializer(q_obj).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminAptitudeQuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_get_aptitude_question_detail",
        summary="Admin - Get Aptitude Question Detail",
        description="Retrieve question details, complete version history, and validation audit logs.",
        responses={200: dict},
    )
    def get(self, request, question_id):
        _enforce_staff(request.user)
        question = AptitudeQuestion.objects.filter(id=question_id).first()
        if not question:
            raise NotFound({"detail": "Aptitude question not found."})

        q_data = AptitudeQuestionSerializer(question).data
        versions = AptitudeQuestionVersionSerializer(
            question.versions.all(), many=True
        ).data
        val_history = list(
            question.validation_history.values(
                "version_number",
                "revision_count",
                "is_valid",
                "failure_reason",
                "created_at",
            )
        )

        return Response(
            {
                "status": "success",
                "data": {
                    "question": q_data,
                    "versions": versions,
                    "validation_history": val_history,
                },
            }
        )


class AdminAptitudeQuestionNewVersionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Admin - Publish New Aptitude Question Version",
        description="Publish an immutable version increment for an aptitude question.",
        request=dict,
        responses={201: dict},
    )
    def post(self, request, question_id):
        _enforce_staff(request.user)
        new_version = admin_publish_new_version(
            request.user, str(question_id), request.data
        )
        return Response(
            {
                "status": "success",
                "message": f"Version {new_version.version_number} published successfully.",
                "data": AptitudeQuestionVersionSerializer(new_version).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminAptitudeQuestionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Admin - Update Aptitude Question Operational Status",
        description="Change status between approved, suspended, and inactive.",
        request=dict,
        responses={200: dict},
    )
    def patch(self, request, question_id):
        _enforce_staff(request.user)
        new_status = request.data.get("status")
        valid_statuses = [
            AptitudeQuestion.STATUS_APPROVED,
            AptitudeQuestion.STATUS_SUSPENDED,
            AptitudeQuestion.STATUS_INACTIVE,
        ]
        if new_status not in valid_statuses:
            raise ValidationError(
                {"detail": f"Status must be one of {valid_statuses}."}
            )

        question = admin_update_question_status(
            request.user, str(question_id), new_status
        )
        return Response(
            {
                "status": "success",
                "message": f"Question status updated to {new_status}.",
                "data": AptitudeQuestionSerializer(question).data,
            }
        )


class AdminAptitudeReportsListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Admin - List Aptitude Question Reports",
        description="View queue of student issue reports for aptitude questions.",
        responses={200: dict},
    )
    def get(self, request):
        _enforce_staff(request.user)
        reports = AptitudeQuestionReport.objects.select_related(
            "question", "reported_by"
        ).order_by("-created_at")
        serializer = AptitudeQuestionReportSerializer(reports, many=True)
        return Response({"status": "success", "data": {"reports": serializer.data}})


class AdminAptitudeReportResolveView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Admin - Resolve Aptitude Question Report",
        description="Resolve or dismiss a student issue report.",
        request=dict,
        responses={200: dict},
    )
    def post(self, request, report_id):
        _enforce_staff(request.user)
        action = request.data.get("action", "resolve")
        notes = request.data.get("notes", "")

        report = admin_resolve_report(request.user, str(report_id), action, notes)
        return Response(
            {
                "status": "success",
                "message": f"Report marked as {report.status}.",
                "data": AptitudeQuestionReportSerializer(report).data,
            }
        )


class AdminAptitudeConfigView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Admin - Get or Update Aptitude Platform Configuration",
        description="View or update daily attempt limits, duration, category distributions, and mixed cutoff.",
        responses={200: dict},
    )
    def get(self, request):
        _enforce_staff(request.user)
        config = AptitudeTestConfig.get_active_config()
        return Response(
            {"status": "success", "data": AptitudeTestConfigSerializer(config).data}
        )

    @extend_schema(
        summary="Admin - Update Aptitude Platform Configuration",
        description="Update daily attempt limits, duration, category distributions, and mixed cutoff.",
        request=dict,
        responses={200: dict},
    )
    def patch(self, request):
        _enforce_staff(request.user)
        config = AptitudeTestConfig.get_active_config()

        daily_limit = request.data.get("daily_limit")
        duration_minutes = request.data.get("duration_minutes")
        total_questions = request.data.get("total_questions")
        distribution = request.data.get("distribution")
        mixed_cutoff = request.data.get("mixed_qualifying_cutoff")

        if daily_limit is not None:
            config.daily_limit = int(daily_limit)
        if duration_minutes is not None:
            config.duration_minutes = int(duration_minutes)
        if total_questions is not None:
            config.total_questions = int(total_questions)
        if distribution is not None and isinstance(distribution, dict):
            config.distribution = distribution
        if mixed_cutoff is not None:
            config.mixed_qualifying_cutoff = float(mixed_cutoff)

        config.save()

        AdminActivityLog.objects.create(
            actor=request.user,
            action="update_aptitude_test_config",
            resource_type="AptitudeTestConfig",
            resource_id=str(config.id),
            details=request.data,
        )

        return Response(
            {
                "status": "success",
                "message": "Aptitude configuration updated.",
                "data": AptitudeTestConfigSerializer(config).data,
            }
        )
