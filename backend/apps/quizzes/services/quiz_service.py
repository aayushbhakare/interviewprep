import logging
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound
from apps.learning.models import Roadmap, RoadmapWeek
from apps.questions.services.question_bank_service import select_quiz_questions
from apps.quizzes.models import (
    WeeklyQuizAssignment,
    AssignmentQuestion,
    QuizAttempt,
    AttemptAnswer,
)
from apps.quizzes.services.evaluation_service import evaluate_quiz_attempt

logger = logging.getLogger(__name__)

QUIZ_DURATION_SECONDS = 75 * 60  # 75 minutes = 4500 seconds
TIMER_GRACE_PERIOD_SECONDS = 60  # 60s network/client tolerance


def prepare_quiz_assignment(roadmap: Roadmap, week_number: int) -> WeeklyQuizAssignment:
    """
    Prepares a 45-question weekly quiz assignment for a specific roadmap and week.
    Follows exact 10/10/10/10/5 distribution and sets status to Ready.
    """
    assignment, created = WeeklyQuizAssignment.objects.get_or_create(
        roadmap=roadmap,
        week_number=week_number,
        defaults={
            "student": roadmap.user,
            "status": WeeklyQuizAssignment.STATUS_PREPARING,
        },
    )

    if (
        assignment.status == WeeklyQuizAssignment.STATUS_READY
        and assignment.assignment_questions.count() == 45
    ):
        return assignment

    week_obj = RoadmapWeek.objects.filter(
        phase__roadmap=roadmap, week_number=week_number
    ).first()
    if week_obj:
        assignment.week = week_obj

    primary_tech = roadmap.language or "Python"
    topic_slug = f"{primary_tech.lower()}-week-{week_number}"

    # Select exactly 45 QuestionVersion instances
    selected_versions = select_quiz_questions(
        student=roadmap.user,
        technology=primary_tech,
        topic_slug=topic_slug,
        difficulty="medium",
    )

    with transaction.atomic():
        # Clear any partial questions if retrying
        assignment.assignment_questions.all().delete()

        for idx, q_ver in enumerate(selected_versions[:45], start=1):
            AssignmentQuestion.objects.create(
                assignment=assignment,
                question_version=q_ver,
                order=idx,
                category=q_ver.question.category,
            )

        assignment.status = WeeklyQuizAssignment.STATUS_READY
        assignment.save(update_fields=["status", "week", "updated_at"])

    return assignment


def prepare_all_quiz_assignments_for_roadmap(roadmap: Roadmap) -> None:
    """
    Prepares assignments for all weeks in the roadmap without blocking.
    """
    weeks = RoadmapWeek.objects.filter(phase__roadmap=roadmap).order_by("week_number")
    for w in weeks:
        try:
            prepare_quiz_assignment(roadmap, w.week_number)
        except Exception as exc:
            logger.error(
                f"Failed preparing quiz assignment for roadmap {roadmap.id} week {w.week_number}: {exc}"
            )


def get_weekly_quiz_overview(roadmap: Roadmap, week_number: int, user) -> dict:
    """
    Returns weekly quiz status, submitted attempt count, latest score, and availability for a week.
    """
    assignment = WeeklyQuizAssignment.objects.filter(
        roadmap=roadmap, week_number=week_number
    ).first()
    if not assignment:
        return {
            "week_number": week_number,
            "status": "not_started",
            "is_ready": False,
            "submitted_attempts": 0,
            "max_attempts": 5,
            "can_attempt": True,
            "latest_score": None,
            "latest_attempt_status": None,
            "has_active_attempt": False,
        }

    attempts = QuizAttempt.objects.filter(assignment=assignment).order_by(
        "-attempt_number"
    )
    submitted_attempts = [
        a
        for a in attempts
        if a.status
        in [
            QuizAttempt.STATUS_SUBMITTED,
            QuizAttempt.STATUS_EVALUATED,
            QuizAttempt.STATUS_PENDING,
        ]
    ]
    submitted_count = len(submitted_attempts)

    in_progress_attempt = next(
        (a for a in attempts if a.status == QuizAttempt.STATUS_IN_PROGRESS), None
    )
    pending_attempt = next(
        (a for a in attempts if a.status == QuizAttempt.STATUS_PENDING), None
    )
    latest_evaluated = next(
        (a for a in attempts if a.status == QuizAttempt.STATUS_EVALUATED), None
    )

    # Determine display status
    if latest_evaluated:
        display_status = "completed"
    elif pending_attempt:
        display_status = "evaluation_pending"
    elif in_progress_attempt:
        display_status = "in_progress"
    elif assignment.status == WeeklyQuizAssignment.STATUS_READY:
        display_status = "ready"
    else:
        display_status = assignment.status

    can_attempt = (
        submitted_count < 5
        and pending_attempt is None
        and assignment.status == WeeklyQuizAssignment.STATUS_READY
    )

    return {
        "assignment_id": str(assignment.id),
        "week_number": week_number,
        "status": display_status,
        "assignment_status": assignment.status,
        "is_ready": assignment.status == WeeklyQuizAssignment.STATUS_READY,
        "submitted_attempts": submitted_count,
        "max_attempts": 5,
        "can_attempt": can_attempt,
        "latest_score": latest_evaluated.score if latest_evaluated else None,
        "latest_attempt_id": str(attempts[0].id) if attempts else None,
        "latest_attempt_status": attempts[0].status if attempts else None,
        "has_active_attempt": in_progress_attempt is not None,
        "active_attempt_id": str(in_progress_attempt.id)
        if in_progress_attempt
        else None,
    }


def start_or_resume_quiz_attempt(
    user, roadmap: Roadmap, week_number: int
) -> tuple[QuizAttempt, bool]:
    """
    Starts a new attempt or resumes an existing in-progress attempt.
    Enforces the 5-submitted-attempt limit and pending evaluation locks.
    Returns (attempt, is_resumed).
    """
    with transaction.atomic():
        assignment = (
            WeeklyQuizAssignment.objects.select_for_update()
            .filter(roadmap=roadmap, week_number=week_number)
            .first()
        )
        if not assignment or assignment.status != WeeklyQuizAssignment.STATUS_READY:
            # Try to prepare it on demand
            assignment = prepare_quiz_assignment(roadmap, week_number)
            assignment = WeeklyQuizAssignment.objects.select_for_update().get(
                pk=assignment.pk
            )

        # 1. Check for existing in-progress attempt
        in_progress = QuizAttempt.objects.filter(
            assignment=assignment,
            student=user,
            status=QuizAttempt.STATUS_IN_PROGRESS,
        ).first()

        if in_progress:
            # Check if expired
            elapsed = (timezone.now() - in_progress.started_at).total_seconds()
            if elapsed > (QUIZ_DURATION_SECONDS + TIMER_GRACE_PERIOD_SECONDS):
                # Auto-submit expired attempt
                submit_quiz_attempt(in_progress.id, user, auto_submit=True)
            else:
                return in_progress, True

        # 2. Check for evaluation pending lock
        has_pending = QuizAttempt.objects.filter(
            assignment=assignment,
            student=user,
            status=QuizAttempt.STATUS_PENDING,
        ).exists()
        if has_pending:
            raise ValidationError(
                {
                    "detail": "An earlier submission is still being evaluated. Retakes are unavailable until evaluation completes."
                }
            )

        # 3. Check 5 submitted attempts limit
        submitted_count = QuizAttempt.objects.filter(
            assignment=assignment,
            student=user,
            status__in=[
                QuizAttempt.STATUS_SUBMITTED,
                QuizAttempt.STATUS_EVALUATED,
                QuizAttempt.STATUS_PENDING,
            ],
        ).count()

        if submitted_count >= 5:
            raise ValidationError(
                {
                    "detail": "Maximum of 5 submitted attempts reached for this weekly quiz."
                }
            )

        # 4. Create new attempt with sequential attempt_number
        last_attempt = (
            QuizAttempt.objects.filter(assignment=assignment)
            .order_by("-attempt_number")
            .first()
        )
        attempt_number = (last_attempt.attempt_number + 1) if last_attempt else 1

        attempt = QuizAttempt.objects.create(
            assignment=assignment,
            student=user,
            attempt_number=attempt_number,
            status=QuizAttempt.STATUS_IN_PROGRESS,
            total_questions=45,
        )

        # Snapshot questions into AttemptAnswer
        questions = assignment.assignment_questions.select_related(
            "question_version__question"
        ).order_by("order")
        for aq in questions:
            qv = aq.question_version
            snapshot = {
                "question_id": str(qv.question.id),
                "version_number": qv.version_number,
                "category": qv.question.category,
                "difficulty": qv.question.difficulty,
                "technology": qv.question.technology,
                "prompt": qv.prompt,
                "code_snippet": qv.code_snippet,
                "expected_answer": qv.expected_answer,
                "explanation": qv.explanation,
                "evaluation_rubric": qv.evaluation_rubric,
                "starter_code": qv.starter_code,
                "test_cases": qv.test_cases,
            }

            AttemptAnswer.objects.create(
                attempt=attempt,
                assignment_question=aq,
                submitted_answer="",
                approach_explanation="",
                is_answered=False,
                question_snapshot=snapshot,
            )

    return attempt, False


def autosave_quiz_answers(attempt_id: str, user, answers_data: list[dict]) -> dict:
    """
    Autosaves user responses to active attempt. Verifies ownership and timer validity.
    """
    attempt = QuizAttempt.objects.filter(id=attempt_id, student=user).first()
    if not attempt:
        raise NotFound({"detail": "Quiz attempt not found."})

    if attempt.status != QuizAttempt.STATUS_IN_PROGRESS:
        raise ValidationError(
            {"detail": f"Attempt is {attempt.status} and cannot be edited."}
        )

    # Server-side timer check
    elapsed = (timezone.now() - attempt.started_at).total_seconds()
    if elapsed > (QUIZ_DURATION_SECONDS + TIMER_GRACE_PERIOD_SECONDS):
        # Auto-submit and inform client
        submit_quiz_attempt(attempt.id, user, auto_submit=True)
        return {
            "is_expired": True,
            "status": QuizAttempt.STATUS_PENDING,
            "remaining_seconds": 0,
            "message": "Time limit exceeded. Quiz has been automatically submitted.",
        }

    remaining_seconds = max(0, int(QUIZ_DURATION_SECONDS - elapsed))

    # Save answers
    answer_map = {str(a["question_id"]): a for a in answers_data if "question_id" in a}
    attempt_answers = attempt.answers.all()

    for ans_record in attempt_answers:
        qid_str = str(ans_record.assignment_question.id)
        if qid_str in answer_map:
            payload = answer_map[qid_str]
            sub = payload.get("submitted_answer", "")
            app = payload.get("approach_explanation", "")
            ans_record.submitted_answer = sub
            ans_record.approach_explanation = app
            ans_record.is_answered = bool((sub or "").strip() or (app or "").strip())
            ans_record.save(
                update_fields=[
                    "submitted_answer",
                    "approach_explanation",
                    "is_answered",
                    "updated_at",
                ]
            )

    answered_count = attempt.answers.filter(is_answered=True).count()
    return {
        "is_expired": False,
        "remaining_seconds": remaining_seconds,
        "answered_count": answered_count,
        "unanswered_count": 45 - answered_count,
    }


def abandon_quiz_attempt(attempt_id: str, user) -> QuizAttempt:
    """
    Abandons an in-progress attempt. Discards answers and does not consume attempt allowance.
    """
    attempt = QuizAttempt.objects.filter(id=attempt_id, student=user).first()
    if not attempt:
        raise NotFound({"detail": "Quiz attempt not found."})

    if attempt.status != QuizAttempt.STATUS_IN_PROGRESS:
        raise ValidationError({"detail": "Only in-progress attempts can be abandoned."})

    with transaction.atomic():
        attempt.status = QuizAttempt.STATUS_ABANDONED
        attempt.score = None
        attempt.correct_count = 0
        attempt.incorrect_count = 0
        attempt.save(
            update_fields=[
                "status",
                "score",
                "correct_count",
                "incorrect_count",
                "updated_at",
            ]
        )

        # Discard attempted answers
        attempt.answers.update(
            submitted_answer="",
            approach_explanation="",
            is_answered=False,
            is_correct=None,
            evaluation_explanation="",
        )

    return attempt


def submit_quiz_attempt(
    attempt_id: str, user, auto_submit: bool = False
) -> QuizAttempt:
    """
    Submits an in-progress attempt, initiates binary evaluation, and updates roadmap progress.
    """
    with transaction.atomic():
        attempt = (
            QuizAttempt.objects.select_for_update()
            .filter(id=attempt_id, student=user)
            .first()
        )
        if not attempt:
            raise NotFound({"detail": "Quiz attempt not found."})

        if attempt.status != QuizAttempt.STATUS_IN_PROGRESS:
            if attempt.status in (
                QuizAttempt.STATUS_PENDING,
                QuizAttempt.STATUS_EVALUATED,
            ):
                return attempt
            raise ValidationError(
                {"detail": f"Cannot submit attempt with status '{attempt.status}'."}
            )

        now = timezone.now()
        attempt.submitted_at = now
        elapsed = (now - attempt.started_at).total_seconds()
        attempt.time_taken_seconds = min(QUIZ_DURATION_SECONDS, int(elapsed))
        attempt.status = QuizAttempt.STATUS_PENDING
        attempt.save(
            update_fields=["submitted_at", "time_taken_seconds", "status", "updated_at"]
        )

    # Run evaluation
    evaluated_attempt = evaluate_quiz_attempt(str(attempt.id))
    return evaluated_attempt


def get_attempt_detail_and_questions(
    attempt: QuizAttempt, is_taking: bool = True
) -> dict:
    """
    Serializes attempt details. While taking, sensitive expected answers and explanations are omitted.
    """
    elapsed = (timezone.now() - attempt.started_at).total_seconds()
    remaining_seconds = (
        max(0, int(QUIZ_DURATION_SECONDS - elapsed))
        if attempt.status == QuizAttempt.STATUS_IN_PROGRESS
        else 0
    )

    answers = attempt.answers.select_related("assignment_question").order_by(
        "assignment_question__order"
    )
    questions_list = []

    for ans in answers:
        snap = ans.question_snapshot or {}
        q_data = {
            "answer_id": str(ans.id),
            "question_id": str(ans.assignment_question.id),
            "order": ans.assignment_question.order,
            "category": snap.get("category", ans.assignment_question.category),
            "difficulty": snap.get("difficulty", "medium"),
            "technology": snap.get("technology", ""),
            "prompt": snap.get("prompt", ""),
            "code_snippet": snap.get("code_snippet", ""),
            "starter_code": snap.get("starter_code", ""),
            "test_cases": snap.get("test_cases", []),
            "submitted_answer": ans.submitted_answer,
            "approach_explanation": ans.approach_explanation,
            "is_answered": ans.is_answered,
        }

        # Include evaluation results only after submission/evaluation
        if not is_taking and attempt.status in (
            QuizAttempt.STATUS_EVALUATED,
            QuizAttempt.STATUS_PENDING,
            QuizAttempt.STATUS_SUBMITTED,
        ):
            q_data["expected_answer"] = snap.get("expected_answer", "")
            q_data["explanation"] = snap.get("explanation", "")
            q_data["evaluation_rubric"] = snap.get("evaluation_rubric", {})
            q_data["is_correct"] = ans.is_correct
            q_data["evaluation_explanation"] = ans.evaluation_explanation

        questions_list.append(q_data)

    return {
        "attempt_id": str(attempt.id),
        "assignment_id": str(attempt.assignment_id),
        "week_number": attempt.assignment.week_number,
        "attempt_number": attempt.attempt_number,
        "status": attempt.status,
        "started_at": attempt.started_at.isoformat(),
        "submitted_at": attempt.submitted_at.isoformat()
        if attempt.submitted_at
        else None,
        "time_taken_seconds": attempt.time_taken_seconds,
        "remaining_seconds": remaining_seconds,
        "total_duration_seconds": QUIZ_DURATION_SECONDS,
        "total_questions": 45,
        "answered_count": sum(1 for q in questions_list if q["is_answered"]),
        "score": attempt.score,
        "correct_count": attempt.correct_count,
        "incorrect_count": attempt.incorrect_count,
        "questions": questions_list,
    }
