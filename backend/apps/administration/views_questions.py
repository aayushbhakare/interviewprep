from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.exceptions import NotFound, ValidationError
from django.db.models import Q
from drf_spectacular.utils import extend_schema

from apps.questions.models import Question, QuestionReport
from apps.questions.serializers import (
    QuestionDetailSerializer,
    QuestionReportSerializer,
    AdminCreateQuestionSerializer,
    AdminCreateVersionSerializer,
    AdminUpdateQuestionStatusSerializer,
)
from apps.questions.services.question_bank_service import (
    admin_create_question,
    admin_create_new_question_version,
    admin_update_question_status,
)


class AdminQuestionListView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="admin_question_bank_list",
        summary="Admin: List & Filter Question Bank",
        description="Retrieve questions with search and filtering by technology, category, difficulty, or status.",
        responses={200: dict},
    )
    def get(self, request):
        qs = Question.objects.prefetch_related("versions").all()

        tech = request.query_params.get("technology")
        if tech:
            qs = qs.filter(technology__iexact=tech)

        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        difficulty = request.query_params.get("difficulty")
        if difficulty:
            qs = qs.filter(difficulty=difficulty)

        status_param = request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(technology__icontains=search)
                | Q(topic_slug__icontains=search)
                | Q(versions__prompt__icontains=search)
            ).distinct()

        # Aggregated stats
        total_count = Question.objects.count()
        approved_count = Question.objects.filter(
            status=Question.STATUS_APPROVED
        ).count()
        suspended_count = Question.objects.filter(
            status=Question.STATUS_SUSPENDED
        ).count()
        inactive_count = Question.objects.filter(
            status=Question.STATUS_INACTIVE
        ).count()

        # Simple limit/offset pagination
        try:
            limit = min(100, max(1, int(request.query_params.get("limit", 50))))
            offset = max(0, int(request.query_params.get("offset", 0)))
        except ValueError:
            limit, offset = 50, 0

        filtered_count = qs.count()
        page_items = qs[offset : offset + limit]
        serializer = QuestionDetailSerializer(page_items, many=True)

        return Response(
            {
                "status": "success",
                "data": {
                    "total": total_count,
                    "approved": approved_count,
                    "suspended": suspended_count,
                    "inactive": inactive_count,
                    "filtered_count": filtered_count,
                    "limit": limit,
                    "offset": offset,
                    "questions": serializer.data,
                },
            }
        )

    @extend_schema(
        summary="Admin: Create Question",
        description="Creates a new question with version 1 and logs to AdminActivityLog.",
        request=AdminCreateQuestionSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = AdminCreateQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vdata = serializer.validated_data

        ip_addr = request.META.get("REMOTE_ADDR")
        question, version = admin_create_question(
            admin_user=request.user,
            technology=vdata["technology"],
            topic_slug=vdata["topic_slug"],
            category=vdata["category"],
            difficulty=vdata["difficulty"],
            prompt=vdata["prompt"],
            code_snippet=vdata.get("code_snippet", ""),
            expected_answer=vdata["expected_answer"],
            evaluation_rubric=vdata.get("evaluation_rubric"),
            explanation=vdata["explanation"],
            starter_code=vdata.get("starter_code", ""),
            test_cases=vdata.get("test_cases"),
            ip_address=ip_addr,
        )

        detail_serializer = QuestionDetailSerializer(question)
        return Response(
            {
                "status": "success",
                "message": "Question created.",
                "data": detail_serializer.data,
            },
            status=201,
        )


class AdminQuestionDetailView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="admin_question_bank_detail",
        summary="Admin: Question Details",
        description="Retrieve full details, all version history, student reports, and validation records for a question.",
        responses={200: dict},
    )
    def get(self, request, question_id):
        try:
            question = Question.objects.prefetch_related(
                "versions__validation_records",
                "reports__student",
            ).get(id=question_id)
        except Question.DoesNotExist:
            raise NotFound({"detail": "Question not found."})

        serializer = QuestionDetailSerializer(question)
        return Response({"status": "success", "data": serializer.data})


class AdminQuestionNewVersionView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Admin: Create New Question Version",
        description="Publishes an improved version of an existing question. Historical attempts retain older snapshots.",
        request=AdminCreateVersionSerializer,
        responses={201: dict},
    )
    def post(self, request, question_id):
        try:
            Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            raise NotFound({"detail": "Question not found."})

        serializer = AdminCreateVersionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vdata = serializer.validated_data

        ip_addr = request.META.get("REMOTE_ADDR")
        version = admin_create_new_question_version(
            admin_user=request.user,
            question_id=str(question_id),
            prompt=vdata["prompt"],
            code_snippet=vdata.get("code_snippet", ""),
            expected_answer=vdata["expected_answer"],
            evaluation_rubric=vdata.get("evaluation_rubric"),
            explanation=vdata["explanation"],
            starter_code=vdata.get("starter_code", ""),
            test_cases=vdata.get("test_cases"),
            change_reason=vdata.get("change_reason", "Admin updated content"),
            ip_address=ip_addr,
        )

        return Response(
            {
                "status": "success",
                "message": f"Version {version.version_number} created successfully.",
                "data": {
                    "question_id": str(question_id),
                    "version_number": version.version_number,
                },
            },
            status=201,
        )


class AdminQuestionStatusView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Admin: Update Question Status",
        description="Updates question status (approved, suspended, inactive) and logs action to AdminActivityLog.",
        request=AdminUpdateQuestionStatusSerializer,
        responses={200: dict},
    )
    def patch(self, request, question_id):
        try:
            Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            raise NotFound({"detail": "Question not found."})

        serializer = AdminUpdateQuestionStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ip_addr = request.META.get("REMOTE_ADDR")
        question = admin_update_question_status(
            admin_user=request.user,
            question_id=str(question_id),
            new_status=serializer.validated_data["status"],
            notes=serializer.validated_data.get("notes", ""),
            ip_address=ip_addr,
        )

        return Response(
            {
                "status": "success",
                "message": f"Question status updated to {question.status}.",
                "data": {"question_id": str(question.id), "status": question.status},
            }
        )


class AdminQuestionReportsListView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Admin: List Student Reports",
        description="Retrieve submitted student question reports with status and reason filtering.",
        responses={200: dict},
    )
    def get(self, request):
        qs = QuestionReport.objects.select_related("question", "student").all()

        status_param = request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        reason_param = request.query_params.get("reason")
        if reason_param:
            qs = qs.filter(reason=reason_param)

        serializer = QuestionReportSerializer(qs[:100], many=True)
        return Response(
            {
                "status": "success",
                "data": {"reports": serializer.data, "total": qs.count()},
            }
        )


class AdminQuestionReportDetailView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Admin: Resolve Student Report",
        description="Mark a student report reviewed, resolved, or dismissed with admin feedback.",
        request=dict,
        responses={200: QuestionReportSerializer},
    )
    def patch(self, request, report_id):
        try:
            report = QuestionReport.objects.get(id=report_id)
        except QuestionReport.DoesNotExist:
            raise NotFound({"detail": "Report not found."})

        new_status = request.data.get("status")
        valid_statuses = [
            QuestionReport.STATUS_REVIEWED,
            QuestionReport.STATUS_RESOLVED,
            QuestionReport.STATUS_DISMISSED,
        ]
        if new_status and new_status not in valid_statuses:
            raise ValidationError(
                {"status": [f"Status must be one of: {', '.join(valid_statuses)}"]}
            )

        if new_status:
            report.status = new_status
        if "admin_notes" in request.data:
            report.admin_notes = request.data["admin_notes"]

        report.save(update_fields=["status", "admin_notes", "updated_at"])
        serializer = QuestionReportSerializer(report)
        return Response(
            {"status": "success", "message": "Report updated.", "data": serializer.data}
        )
