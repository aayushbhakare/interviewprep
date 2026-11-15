import logging
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound

from apps.aptitude.models import (
    AptitudeQuestion,
    AptitudeTestConfig,
    AptitudeSession,
    AptitudeSessionQuestion,
    AptitudeSessionAnswer,
)
from apps.aptitude.services.aptitude_bank_service import select_aptitude_test_questions
from apps.learning.models import Roadmap

logger = logging.getLogger(__name__)

TIMER_GRACE_PERIOD_SECONDS = 60
INELIGIBLE_EXPERIENCE_LEVELS = ["1–3 years", "3–5 years", "5+ years"]


def check_fresher_eligibility(user) -> bool:
    """
    Enforces eligibility for fresher aptitude practice.
    Users with experienced profiles (1-3 yrs, 3-5 yrs, 5+ yrs) are denied standalone aptitude practice.
    """
    # Check UserProfile
    profile = getattr(user, "profile", None)
    if profile and profile.experience_level in INELIGIBLE_EXPERIENCE_LEVELS:
        raise PermissionDenied(
            "Aptitude practice is designed for freshers and entry-level candidates. Your profile experience level is not eligible."
        )

    # Check active roadmap
    active_roadmap = Roadmap.objects.filter(user=user, is_active=True).first()
    if (
        active_roadmap
        and active_roadmap.experience_level in INELIGIBLE_EXPERIENCE_LEVELS
    ):
        raise PermissionDenied(
            "Aptitude practice is designed for freshers and entry-level candidates. Your active roadmap experience level is not eligible."
        )

    return True


def get_daily_attempt_usage(user, test_config: AptitudeTestConfig = None) -> dict:
    """
    Calculates the number of submitted standalone aptitude sessions for the user today.
    Abandoned sessions and Mixed recruitment stages are strictly exempted.
    """
    if not test_config:
        test_config = AptitudeTestConfig.get_active_config()

    today = timezone.now().date()
    used_count = AptitudeSession.objects.filter(
        student=user,
        session_type=AptitudeSession.TYPE_STANDALONE,
        status=AptitudeSession.STATUS_SUBMITTED,
        submitted_at__date=today,
    ).count()

    limit = test_config.daily_limit
    remaining = max(0, limit - used_count)

    return {
        "used": used_count,
        "limit": limit,
        "remaining": remaining,
        "date": today.isoformat(),
    }


def start_or_resume_aptitude_session(
    user, session_type: str = AptitudeSession.TYPE_STANDALONE
) -> tuple[AptitudeSession, bool]:
    """
    Starts a new aptitude session or resumes an existing in-progress session.
    Enforces fresher eligibility and daily attempt quotas for standalone practice.
    """
    test_config = AptitudeTestConfig.get_active_config()

    if session_type == AptitudeSession.TYPE_STANDALONE:
        check_fresher_eligibility(user)

    duration_seconds = test_config.duration_minutes * 60

    with transaction.atomic():
        # Check for existing in-progress session
        in_progress = (
            AptitudeSession.objects.select_for_update()
            .filter(
                student=user,
                session_type=session_type,
                status=AptitudeSession.STATUS_IN_PROGRESS,
            )
            .first()
        )

        if in_progress:
            elapsed = (timezone.now() - in_progress.started_at).total_seconds()
            if elapsed > (duration_seconds + TIMER_GRACE_PERIOD_SECONDS):
                # Auto-submit expired session
                submitted = submit_aptitude_session(
                    in_progress.id, user, auto_submit=True
                )
                return submitted, False
            return in_progress, True

        # Check daily attempt limit for standalone practice
        if session_type == AptitudeSession.TYPE_STANDALONE:
            usage = get_daily_attempt_usage(user, test_config)
            if usage["remaining"] <= 0:
                raise ValidationError(
                    {
                        "detail": f"Daily limit reached. You have completed {usage['limit']} aptitude sessions today."
                    }
                )

        # Select questions for new session
        question_versions = select_aptitude_test_questions(user, test_config)
        total_questions = len(question_versions)

        config_snapshot = {
            "name": test_config.name,
            "total_questions": total_questions,
            "duration_minutes": test_config.duration_minutes,
            "distribution": test_config.distribution,
            "daily_limit": test_config.daily_limit,
            "mixed_qualifying_cutoff": test_config.mixed_qualifying_cutoff,
        }

        session = AptitudeSession.objects.create(
            student=user,
            session_type=session_type,
            status=AptitudeSession.STATUS_IN_PROGRESS,
            total_questions=total_questions,
            total_marks=total_questions,
            started_at=timezone.now(),
            test_config_snapshot=config_snapshot,
        )

        for idx, qv in enumerate(question_versions, start=1):
            snap = {
                "question_id": str(qv.question.id),
                "version_id": str(qv.id),
                "category": qv.question.category,
                "topic": qv.question.topic,
                "difficulty": qv.question.difficulty,
                "question_text": qv.question_text,
                "options": qv.options,
                "correct_option_index": qv.correct_option_index,
                "explanation": qv.explanation,
            }
            sq = AptitudeSessionQuestion.objects.create(
                session=session,
                question=qv.question,
                question_version=qv,
                order=idx,
                question_snapshot=snap,
            )
            AptitudeSessionAnswer.objects.create(
                session=session,
                session_question=sq,
                selected_option_index=None,
                is_correct=None,
            )

    return session, False


def autosave_aptitude_answers(session_id: str, user, answers_data: list[dict]) -> dict:
    """
    Debounced autosave of student option selections.
    Enforces timer expiration on the backend.
    """
    session = AptitudeSession.objects.filter(id=session_id, student=user).first()
    if not session:
        raise NotFound({"detail": "Aptitude session not found."})

    if session.status != AptitudeSession.STATUS_IN_PROGRESS:
        raise ValidationError(
            {"detail": f"Session is {session.status} and cannot be modified."}
        )

    config_snapshot = session.test_config_snapshot or {}
    duration_minutes = config_snapshot.get("duration_minutes", 60)
    duration_seconds = duration_minutes * 60

    elapsed = (timezone.now() - session.started_at).total_seconds()
    if elapsed > (duration_seconds + TIMER_GRACE_PERIOD_SECONDS):
        submit_aptitude_session(session.id, user, auto_submit=True)
        return {
            "is_expired": True,
            "status": AptitudeSession.STATUS_SUBMITTED,
            "remaining_seconds": 0,
            "message": "Time limit exceeded. Session has been automatically submitted.",
        }

    remaining_seconds = max(0, int(duration_seconds - elapsed))

    # Save answers
    answer_map = {
        str(a.get("question_id")): a for a in answers_data if "question_id" in a
    }

    session_answers = session.answers.select_related("session_question")
    now = timezone.now()

    for ans in session_answers:
        qid_key = str(ans.session_question.id)
        if qid_key in answer_map:
            incoming = answer_map[qid_key]
            val = incoming.get("selected_option_index")
            if val is not None and val != "":
                try:
                    ans.selected_option_index = int(val)
                    ans.answered_at = now
                    ans.save(
                        update_fields=[
                            "selected_option_index",
                            "answered_at",
                            "updated_at",
                        ]
                    )
                except (ValueError, TypeError):
                    pass
            elif val is None or val == "":
                ans.selected_option_index = None
                ans.answered_at = None
                ans.save(
                    update_fields=["selected_option_index", "answered_at", "updated_at"]
                )

    return {
        "is_expired": False,
        "status": AptitudeSession.STATUS_IN_PROGRESS,
        "remaining_seconds": remaining_seconds,
        "saved_count": len(answer_map),
    }


def abandon_aptitude_session(session_id: str, user) -> AptitudeSession:
    """
    Abandons an in-progress session.
    Discards answers without consuming a daily attempt quota or calculating a score.
    """
    session = AptitudeSession.objects.filter(id=session_id, student=user).first()
    if not session:
        raise NotFound({"detail": "Aptitude session not found."})

    if session.status != AptitudeSession.STATUS_IN_PROGRESS:
        raise ValidationError(
            {"detail": f"Cannot abandon session with status '{session.status}'."}
        )

    with transaction.atomic():
        session.status = AptitudeSession.STATUS_ABANDONED
        session.time_spent_seconds = int(
            (timezone.now() - session.started_at).total_seconds()
        )
        session.save(update_fields=["status", "time_spent_seconds", "updated_at"])

        # Clear answers so no unsubmitted data is persisted
        session.answers.update(
            selected_option_index=None, is_correct=None, answered_at=None
        )

    return session


def submit_aptitude_session(
    session_id: str, user, auto_submit: bool = False
) -> AptitudeSession:
    """
    Submits an aptitude session, objectively grading every multiple-choice question against stored correct answers.
    Updates question bank performance stats atomically.
    """
    with transaction.atomic():
        session = (
            AptitudeSession.objects.select_for_update()
            .filter(id=session_id, student=user)
            .first()
        )
        if not session:
            raise NotFound({"detail": "Aptitude session not found."})

        if session.status != AptitudeSession.STATUS_IN_PROGRESS:
            if session.status == AptitudeSession.STATUS_SUBMITTED:
                return session
            raise ValidationError(
                {"detail": f"Cannot submit session with status '{session.status}'."}
            )

        now = timezone.now()
        config_snapshot = session.test_config_snapshot or {}
        duration_minutes = config_snapshot.get("duration_minutes", 60)
        max_duration_seconds = duration_minutes * 60

        elapsed = (now - session.started_at).total_seconds()
        session.time_spent_seconds = min(max_duration_seconds, int(elapsed))
        session.submitted_at = now

        # Evaluate all questions objectively
        answers = session.answers.select_related("session_question")
        correct_count = 0
        incorrect_count = 0

        for ans in answers:
            snap = ans.session_question.question_snapshot or {}
            correct_index = snap.get("correct_option_index")
            selected_index = ans.selected_option_index

            if selected_index is not None and selected_index == correct_index:
                ans.is_correct = True
                correct_count += 1
                try:
                    q_id = ans.session_question.question_id
                    AptitudeQuestion.objects.filter(pk=q_id).update(
                        correct_count=F("correct_count") + 1,
                        times_attempted=F("times_attempted") + 1,
                    )
                except Exception as exc:
                    logger.warning(
                        "Failed to increment question success counter: %s", exc
                    )
            else:
                ans.is_correct = False
                incorrect_count += 1
                try:
                    q_id = ans.session_question.question_id
                    AptitudeQuestion.objects.filter(pk=q_id).update(
                        times_attempted=F("times_attempted") + 1,
                    )
                except Exception as exc:
                    logger.warning(
                        "Failed to increment question attempt counter: %s", exc
                    )

            ans.save(update_fields=["is_correct", "updated_at"])

        total_questions = len(answers) or session.total_questions or 45
        session.correct_count = correct_count
        session.incorrect_count = incorrect_count
        session.total_questions = total_questions
        session.total_marks = correct_count
        session.percentage = round((correct_count / float(total_questions)) * 100.0, 2)
        session.score = session.percentage
        session.status = AptitudeSession.STATUS_SUBMITTED
        session.save(
            update_fields=[
                "status",
                "time_spent_seconds",
                "submitted_at",
                "correct_count",
                "incorrect_count",
                "total_questions",
                "total_marks",
                "percentage",
                "score",
                "updated_at",
            ]
        )

    return session


def get_session_taking_detail(session: AptitudeSession) -> dict:
    """
    Serializes test taking state for the student.
    Never exposes correct answers or explanations while test is in progress.
    """
    config_snapshot = session.test_config_snapshot or {}
    duration_minutes = config_snapshot.get("duration_minutes", 60)
    duration_seconds = duration_minutes * 60

    elapsed = (timezone.now() - session.started_at).total_seconds()
    remaining_seconds = max(0, int(duration_seconds - elapsed))

    answers = session.answers.select_related("session_question").order_by(
        "session_question__order"
    )
    questions_list = []

    for ans in answers:
        snap = ans.session_question.question_snapshot or {}
        questions_list.append(
            {
                "question_id": str(ans.session_question.id),
                "order": ans.session_question.order,
                "category": snap.get("category", ""),
                "topic": snap.get("topic", ""),
                "difficulty": snap.get("difficulty", "medium"),
                "question_text": snap.get("question_text", ""),
                "options": snap.get("options", []),
                "selected_option_index": ans.selected_option_index,
                "is_answered": ans.selected_option_index is not None,
            }
        )

    return {
        "session_id": str(session.id),
        "session_type": session.session_type,
        "status": session.status,
        "total_questions": session.total_questions,
        "duration_minutes": duration_minutes,
        "remaining_seconds": remaining_seconds,
        "started_at": session.started_at.isoformat(),
        "questions": questions_list,
    }


def get_session_results_detail(session: AptitudeSession) -> dict:
    """
    Serializes comprehensive question-by-question review and objective scorecard.
    Rejects in-progress or abandoned sessions to prevent solution leaks.
    """
    if session.status in (
        AptitudeSession.STATUS_IN_PROGRESS,
        AptitudeSession.STATUS_ABANDONED,
    ):
        raise ValidationError(
            {
                "detail": "Results and solutions are not available for in-progress or abandoned sessions."
            }
        )

    config_snapshot = session.test_config_snapshot or {}
    mixed_cutoff = config_snapshot.get("mixed_qualifying_cutoff", 60.0)

    answers = session.answers.select_related("session_question").order_by(
        "session_question__order"
    )
    questions_list = []

    for ans in answers:
        snap = ans.session_question.question_snapshot or {}
        questions_list.append(
            {
                "question_id": str(ans.session_question.id),
                "order": ans.session_question.order,
                "category": snap.get("category", ""),
                "topic": snap.get("topic", ""),
                "difficulty": snap.get("difficulty", "medium"),
                "question_text": snap.get("question_text", ""),
                "options": snap.get("options", []),
                "selected_option_index": ans.selected_option_index,
                "correct_option_index": snap.get("correct_option_index"),
                "is_correct": ans.is_correct,
                "explanation": snap.get("explanation", ""),
            }
        )

    result_data = {
        "session_id": str(session.id),
        "session_type": session.session_type,
        "status": session.status,
        "score": session.score,
        "percentage": session.percentage,
        "total_marks": session.total_marks,
        "correct_count": session.correct_count,
        "incorrect_count": session.incorrect_count,
        "total_questions": session.total_questions,
        "time_spent_seconds": session.time_spent_seconds,
        "started_at": session.started_at.isoformat(),
        "submitted_at": session.submitted_at.isoformat()
        if session.submitted_at
        else None,
        "questions": questions_list,
    }

    # For future Phase 6 Mixed Stage recruitment evaluation
    if session.session_type == AptitudeSession.TYPE_MIXED_STAGE:
        result_data["mixed_qualifying_cutoff"] = mixed_cutoff
        result_data["is_passed"] = (session.percentage or 0.0) >= mixed_cutoff

    return result_data
