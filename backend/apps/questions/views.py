from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import NotFound, PermissionDenied
from drf_spectacular.utils import extend_schema

from apps.questions.models import Question
from apps.questions.serializers import (
    QuestionReportCreateSerializer,
    QuestionReportSerializer,
)
from apps.questions.services.question_bank_service import report_question


def _enforce_verified_student(user):
    if not user.is_authenticated:
        raise PermissionDenied({"detail": "Authentication required."})
    if not getattr(user, "is_verified", False):
        raise PermissionDenied({"detail": "Email verification is required."})


class QuestionReportView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Report a Question Issue",
        description="Allows verified students to submit an issue report (e.g. incorrect answer, ambiguity) on a question.",
        request=QuestionReportCreateSerializer,
        responses={201: QuestionReportSerializer},
    )
    def post(self, request, question_id):
        _enforce_verified_student(request.user)
        try:
            Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            raise NotFound({"detail": "Question not found."})

        serializer = QuestionReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report_obj, created = report_question(
            student=request.user,
            question_id=str(question_id),
            reason=serializer.validated_data["reason"],
            description=serializer.validated_data["description"],
        )

        resp_serializer = QuestionReportSerializer(report_obj)
        message = (
            "Report submitted successfully."
            if created
            else "A pending report for this issue already exists."
        )
        return Response(
            {"status": "success", "message": message, "data": resp_serializer.data},
            status=201 if created else 200,
        )


class QuestionCatalogView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Get Question Categories and Metadata",
        description="Retrieve available technical categories, difficulties, and target distribution.",
        responses={200: dict},
    )
    def get(self, request):
        return Response(
            {
                "status": "success",
                "data": {
                    "categories": [
                        {"key": k, "label": label}
                        for k, label in Question.CATEGORY_CHOICES
                    ],
                    "difficulties": [
                        {"key": k, "label": label}
                        for k, label in Question.DIFFICULTY_CHOICES
                    ],
                    "quiz_distribution": {
                        "output_prediction": 10,
                        "error_debugging": 10,
                        "coding": 10,
                        "scenario": 10,
                        "conceptual": 5,
                        "total": 45,
                    },
                    "quiz_duration_minutes": 75,
                },
            }
        )
