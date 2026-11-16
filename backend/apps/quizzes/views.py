from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import (
    PermissionDenied,
    NotAuthenticated,
    NotFound,
    ValidationError,
)
from drf_spectacular.utils import extend_schema

from apps.learning.models import Roadmap
from apps.quizzes.models import WeeklyQuizAssignment, QuizAttempt
from apps.quizzes.serializers import (
    QuizAutosaveSerializer,
    QuizAttemptHistoryItemSerializer,
)
from apps.quizzes.services.quiz_service import (
    get_weekly_quiz_overview,
    start_or_resume_quiz_attempt,
    autosave_quiz_answers,
    abandon_quiz_attempt,
    submit_quiz_attempt,
    get_attempt_detail_and_questions,
)


def _enforce_verified_student(user):
    if not user.is_authenticated:
        raise NotAuthenticated(
            {"detail": "Authentication credentials were not provided."}
        )
    if not getattr(user, "is_verified", False):
        raise PermissionDenied(
            {
                "detail": "Email verification is required to access the weekly quiz system."
            }
        )


def _get_active_roadmap(user):
    roadmap = Roadmap.objects.filter(user=user, is_active=True).first()
    if not roadmap:
        raise NotFound({"detail": "No active learning roadmap found for this student."})
    return roadmap


class WeeklyQuizAssignmentOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Weekly Quiz Overview",
        description="Retrieve weekly quiz status, submitted attempt counts, and eligibility for a week.",
        responses={200: dict},
    )
    def get(self, request, week_number: int):
        _enforce_verified_student(request.user)
        roadmap = _get_active_roadmap(request.user)
        overview = get_weekly_quiz_overview(roadmap, week_number, request.user)
        return Response({"status": "success", "data": overview})


class WeeklyQuizStartView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Start or Resume Weekly Quiz Attempt",
        description="Starts a new attempt or resumes an in-progress attempt. Returns 45 questions and timer info.",
        request=None,
        responses={200: dict, 201: dict},
    )
    def post(self, request, week_number: int):
        _enforce_verified_student(request.user)
        roadmap = _get_active_roadmap(request.user)
        attempt, is_resumed = start_or_resume_quiz_attempt(
            request.user, roadmap, week_number
        )
        data = get_attempt_detail_and_questions(attempt, is_taking=True)
        status_code = 200 if is_resumed else 201
        return Response(
            {"status": "success", "data": data, "is_resumed": is_resumed},
            status=status_code,
        )


class QuizAutosaveView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Autosave Quiz Answers",
        description="Persists answer and approach updates for an active attempt with server-side timer enforcement.",
        request=QuizAutosaveSerializer,
        responses={200: dict},
    )
    def patch(self, request, attempt_id):
        _enforce_verified_student(request.user)
        serializer = QuizAutosaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = autosave_quiz_answers(
            attempt_id=str(attempt_id),
            user=request.user,
            answers_data=serializer.validated_data.get("answers", []),
        )
        return Response({"status": "success", "data": result})


class QuizAbandonView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Abandon Quiz Attempt",
        description="Abandons an in-progress attempt, wipes draft answers, and leaves the attempt allowance unconsumed.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, attempt_id):
        _enforce_verified_student(request.user)
        attempt = abandon_quiz_attempt(str(attempt_id), request.user)
        return Response(
            {
                "status": "success",
                "message": "Quiz attempt abandoned. Answers discarded.",
                "data": {"attempt_id": str(attempt.id), "status": attempt.status},
            }
        )


class QuizSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Submit Quiz Attempt",
        description="Submits the active attempt, triggers binary evaluation, and updates week progress milestones.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, attempt_id):
        _enforce_verified_student(request.user)
        evaluated_attempt = submit_quiz_attempt(str(attempt_id), request.user)
        data = get_attempt_detail_and_questions(evaluated_attempt, is_taking=False)
        return Response(
            {
                "status": "success",
                "message": "Quiz submitted successfully.",
                "data": data,
            }
        )


class QuizResultsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Quiz Results",
        description="Retrieve question-by-question review, explanations, and final score for a submitted attempt.",
        responses={200: dict},
    )
    def get(self, request, attempt_id):
        _enforce_verified_student(request.user)
        attempt = QuizAttempt.objects.filter(
            id=attempt_id, student=request.user
        ).first()
        if not attempt:
            raise NotFound({"detail": "Quiz attempt not found."})

        if attempt.status in (
            QuizAttempt.STATUS_IN_PROGRESS,
            QuizAttempt.STATUS_ABANDONED,
        ):
            raise ValidationError(
                {
                    "detail": "Results and solutions are not available for in-progress or abandoned attempts."
                }
            )

        data = get_attempt_detail_and_questions(attempt, is_taking=False)
        return Response({"status": "success", "data": data})


class WeeklyQuizHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Weekly Quiz Attempt History",
        description="Retrieve chronological list of past attempts and remaining allowances for this week.",
        responses={200: dict},
    )
    def get(self, request, week_number: int):
        _enforce_verified_student(request.user)
        roadmap = _get_active_roadmap(request.user)
        assignment = WeeklyQuizAssignment.objects.filter(
            roadmap=roadmap, week_number=week_number
        ).first()
        if not assignment:
            return Response(
                {
                    "status": "success",
                    "data": {
                        "attempts": [],
                        "submitted_count": 0,
                        "remaining_attempts": 5,
                    },
                }
            )

        attempts = QuizAttempt.objects.filter(assignment=assignment).order_by(
            "-attempt_number"
        )
        serializer = QuizAttemptHistoryItemSerializer(attempts, many=True)
        submitted_count = sum(
            1
            for a in attempts
            if a.status
            in [
                QuizAttempt.STATUS_SUBMITTED,
                QuizAttempt.STATUS_EVALUATED,
                QuizAttempt.STATUS_PENDING,
            ]
        )
        return Response(
            {
                "status": "success",
                "data": {
                    "attempts": serializer.data,
                    "submitted_count": submitted_count,
                    "remaining_attempts": max(0, 5 - submitted_count),
                },
            }
        )
