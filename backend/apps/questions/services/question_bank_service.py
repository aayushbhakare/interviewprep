import logging
from django.db import transaction
from apps.administration.models import AdminActivityLog
from apps.questions.models import Question, QuestionVersion, QuestionReport
from apps.questions.services.question_generator import (
    seed_initial_question_bank,
    generate_additional_questions_for_pool,
    store_and_validate_question,
)

logger = logging.getLogger(__name__)


def get_or_seed_questions_for_technology(technology: str) -> None:
    """
    Ensures baseline questions exist for the specified technology.
    """
    count = Question.objects.filter(
        technology__iexact=technology, status=Question.STATUS_APPROVED
    ).count()
    if count < 45:
        seed_initial_question_bank(technology)


def select_quiz_questions(
    student,
    technology: str,
    topic_slug: str,
    difficulty: str = "medium",
) -> list[QuestionVersion]:
    """
    Selects exactly 45 questions adhering strictly to the required distribution:
    - 10 Code Output Prediction
    - 10 Find Error / Debugging
    - 10 Coding Problems
    - 10 Scenario-Based Questions
    - 5 Conceptual / Short Answer
    Prioritizes questions unseen by the student.
    """
    get_or_seed_questions_for_technology(technology)

    # Required distribution
    category_quotas = {
        Question.CATEGORY_OUTPUT: 10,
        Question.CATEGORY_DEBUGGING: 10,
        Question.CATEGORY_CODING: 10,
        Question.CATEGORY_SCENARIO: 10,
        Question.CATEGORY_CONCEPTUAL: 5,
    }

    # Questions the student previously encountered in submitted attempts
    from apps.quizzes.models import QuizAttempt, AttemptAnswer

    seen_question_ids = set(
        AttemptAnswer.objects.filter(
            attempt__student=student,
            attempt__status__in=[
                QuizAttempt.STATUS_SUBMITTED,
                QuizAttempt.STATUS_EVALUATED,
                QuizAttempt.STATUS_PENDING,
            ],
        ).values_list("assignment_question__question_version__question_id", flat=True)
    )

    selected_versions = []

    for category, quota in category_quotas.items():
        base_qs = Question.objects.filter(
            technology__iexact=technology,
            category=category,
            status=Question.STATUS_APPROVED,
        )

        # 1. Unseen questions first
        unseen_qs = base_qs.exclude(id__in=seen_question_ids)
        category_questions = list(unseen_qs[:quota])

        # 2. If unseen is less than quota, reuse approved seen questions
        if len(category_questions) < quota:
            needed = quota - len(category_questions)
            already_chosen_ids = {q.id for q in category_questions}
            seen_pool = list(
                base_qs.filter(id__in=seen_question_ids).exclude(
                    id__in=already_chosen_ids
                )[:needed]
            )
            category_questions.extend(seen_pool)

        # 3. If still less than quota, generate additional questions on the fly
        if len(category_questions) < quota:
            needed = quota - len(category_questions)
            new_generated = generate_additional_questions_for_pool(
                technology=technology,
                topic_slug=topic_slug,
                category=category,
                difficulty=difficulty,
                count_needed=needed,
            )
            category_questions.extend(new_generated)

        # Retrieve the latest approved QuestionVersion for each chosen Question
        category_selected = []
        for q in category_questions:
            version = (
                q.versions.filter(validation_status=QuestionVersion.STATUS_APPROVED)
                .order_by("-version_number")
                .first()
            )
            if version:
                category_selected.append(version)
                q.times_assigned += 1
                q.save(update_fields=["times_assigned"])
                if len(category_selected) == quota:
                    break

        selected_versions.extend(category_selected)

    return selected_versions


def report_question(
    student,
    question_id: str,
    reason: str,
    description: str,
) -> tuple[QuestionReport, bool]:
    """
    Creates a student report with duplicate grouping to prevent uncontrolled duplicate records.
    Returns (report_obj, created_boolean).
    """
    question = Question.objects.get(id=question_id)

    # Duplicate check for same student, same question, and pending status
    existing = QuestionReport.objects.filter(
        student=student,
        question=question,
        reason=reason,
        status=QuestionReport.STATUS_PENDING,
    ).first()

    if existing:
        return existing, False

    report = QuestionReport.objects.create(
        student=student,
        question=question,
        reason=reason,
        description=description,
        status=QuestionReport.STATUS_PENDING,
    )

    # Usage-based review trigger: If a question accumulates >= 3 pending reports, suspend it from future assignments
    pending_count = QuestionReport.objects.filter(
        question=question, status=QuestionReport.STATUS_PENDING
    ).count()
    if pending_count >= 3:
        question.status = Question.STATUS_SUSPENDED
        question.save(update_fields=["status"])

    return report, True


@transaction.atomic
def admin_create_question(
    admin_user,
    technology: str,
    topic_slug: str,
    category: str,
    difficulty: str,
    prompt: str,
    code_snippet: str = "",
    expected_answer: str = "",
    evaluation_rubric: dict | None = None,
    explanation: str = "",
    starter_code: str = "",
    test_cases: list | None = None,
    ip_address: str | None = None,
) -> tuple[Question, QuestionVersion]:
    """
    Admin explicitly creates a question with version 1.
    """
    content_data = {
        "prompt": prompt,
        "code_snippet": code_snippet,
        "expected_answer": expected_answer,
        "evaluation_rubric": evaluation_rubric or {},
        "explanation": explanation,
        "starter_code": starter_code,
        "test_cases": test_cases or [],
        "category": category,
    }

    question, version = store_and_validate_question(
        technology=technology,
        topic_slug=topic_slug,
        category=category,
        difficulty=difficulty,
        content_data=content_data,
    )

    AdminActivityLog.objects.create(
        actor=admin_user,
        action="create_question",
        resource_type="question",
        resource_id=str(question.id),
        details={
            "technology": technology,
            "category": category,
            "difficulty": difficulty,
        },
        ip_address=ip_address,
    )

    return question, version


@transaction.atomic
def admin_create_new_question_version(
    admin_user,
    question_id: str,
    prompt: str,
    code_snippet: str = "",
    expected_answer: str = "",
    evaluation_rubric: dict | None = None,
    explanation: str = "",
    starter_code: str = "",
    test_cases: list | None = None,
    change_reason: str = "Admin updated content",
    ip_address: str | None = None,
) -> QuestionVersion:
    """
    Admin updates a question by creating a NEW version, preserving existing attempt snapshots.
    """
    question = Question.objects.select_for_update().get(id=question_id)
    new_version_num = question.current_version_number + 1

    version = QuestionVersion.objects.create(
        question=question,
        version_number=new_version_num,
        prompt=prompt,
        code_snippet=code_snippet,
        expected_answer=expected_answer,
        evaluation_rubric=evaluation_rubric or {},
        explanation=explanation,
        starter_code=starter_code,
        test_cases=test_cases or [],
        validation_status=QuestionVersion.STATUS_APPROVED,
        change_reason=change_reason,
    )

    question.current_version_number = new_version_num
    question.save(update_fields=["current_version_number"])

    AdminActivityLog.objects.create(
        actor=admin_user,
        action="update_question_version",
        resource_type="question",
        resource_id=str(question.id),
        details={"version_number": new_version_num, "change_reason": change_reason},
        ip_address=ip_address,
    )

    return version


@transaction.atomic
def admin_update_question_status(
    admin_user,
    question_id: str,
    new_status: str,
    notes: str = "",
    ip_address: str | None = None,
) -> Question:
    """
    Admin alters question status (approved, suspended, inactive).
    """
    question = Question.objects.select_for_update().get(id=question_id)
    old_status = question.status
    question.status = new_status
    question.save(update_fields=["status"])

    AdminActivityLog.objects.create(
        actor=admin_user,
        action=f"question_status_{new_status}",
        resource_type="question",
        resource_id=str(question.id),
        details={"old_status": old_status, "new_status": new_status, "notes": notes},
        ip_address=ip_address,
    )

    return question
