import logging
from django.db import transaction
from django.db.models import F
from apps.aptitude.models import (
    AptitudeQuestion,
    AptitudeQuestionVersion,
    AptitudeQuestionReport,
    AptitudeTestConfig,
    AptitudeSessionQuestion,
)
from apps.aptitude.services.seed_data import seed_initial_aptitude_bank
from apps.aptitude.services.question_generator import (
    store_and_validate_aptitude_question,
    generate_additional_aptitude_questions,
)
from apps.administration.models import AdminActivityLog

logger = logging.getLogger(__name__)

REPORT_SUSPENSION_THRESHOLD = 3


def select_aptitude_test_questions(
    user, test_config: AptitudeTestConfig
) -> list[AptitudeQuestionVersion]:
    """
    Selects questions for an aptitude test session adhering to the configured category distribution.
    Prioritizes unseen questions for the student, automatically replenishing from the generator if needed.
    """
    # Ensure baseline seed data is populated
    if (
        AptitudeQuestion.objects.filter(status=AptitudeQuestion.STATUS_APPROVED).count()
        < 45
    ):
        seed_initial_aptitude_bank()

    distribution = test_config.distribution or {
        AptitudeQuestion.CATEGORY_QUANT: 15,
        AptitudeQuestion.CATEGORY_LOGICAL: 15,
        AptitudeQuestion.CATEGORY_VERBAL: 15,
    }

    # Identify questions the student has already seen in past sessions
    seen_question_ids = set(
        AptitudeSessionQuestion.objects.filter(session__student=user).values_list(
            "question_id", flat=True
        )
    )

    selected_versions: list[AptitudeQuestionVersion] = []

    for category, quota in distribution.items():
        if quota <= 0:
            continue

        # 1. Unseen approved questions
        category_questions = list(
            AptitudeQuestion.objects.filter(
                category=category,
                status=AptitudeQuestion.STATUS_APPROVED,
                is_active=True,
            )
            .exclude(id__in=seen_question_ids)
            .order_by("times_assigned", "created_at")[:quota]
        )

        # 2. If pool is short, replenish with generated questions
        if len(category_questions) < quota:
            needed = quota - len(category_questions)
            new_generated = generate_additional_aptitude_questions(
                category=category,
                topic="Comprehensive Aptitude",
                difficulty=AptitudeQuestion.DIFFICULTY_MEDIUM,
                count_needed=needed,
            )
            for gq in new_generated:
                if gq not in category_questions:
                    category_questions.append(gq)

        # 3. If still short, draw from seen questions (prioritizing least assigned)
        if len(category_questions) < quota:
            needed = quota - len(category_questions)
            seen_fallback = list(
                AptitudeQuestion.objects.filter(
                    category=category,
                    status=AptitudeQuestion.STATUS_APPROVED,
                    is_active=True,
                )
                .exclude(id__in=[q.id for q in category_questions])
                .order_by("times_assigned", "created_at")[:needed]
            )
            category_questions.extend(seen_fallback)

        # Select latest valid versions and increment usage counter
        category_selected = []
        for q in category_questions:
            version = (
                q.versions.filter(
                    validation_status=AptitudeQuestionVersion.VALIDATION_VALID
                )
                .order_by("-version_number")
                .first()
            )
            if version:
                category_selected.append(version)
                AptitudeQuestion.objects.filter(pk=q.pk).update(
                    times_assigned=F("times_assigned") + 1
                )
                if len(category_selected) == quota:
                    break

        selected_versions.extend(category_selected)

    return selected_versions


def report_aptitude_question(
    student,
    question_id: str,
    reason: str,
    description: str,
) -> tuple[AptitudeQuestionReport, bool]:
    """
    Submits an issue report for an aptitude question with duplicate grouping.
    Automatically suspends the question if active reports reach REPORT_SUSPENSION_THRESHOLD.
    """
    question = AptitudeQuestion.objects.get(id=question_id)

    # Check for existing identical pending report
    existing = AptitudeQuestionReport.objects.filter(
        question=question,
        reported_by=student,
        reason=reason,
        status=AptitudeQuestionReport.STATUS_PENDING,
    ).first()

    if existing:
        return existing, False

    with transaction.atomic():
        report = AptitudeQuestionReport.objects.create(
            question=question,
            reported_by=student,
            reason=reason,
            description=description,
            status=AptitudeQuestionReport.STATUS_PENDING,
        )

        active_reports_count = AptitudeQuestionReport.objects.filter(
            question=question,
            status__in=[
                AptitudeQuestionReport.STATUS_PENDING,
                AptitudeQuestionReport.STATUS_REVIEWED,
            ],
        ).count()

        if active_reports_count >= REPORT_SUSPENSION_THRESHOLD:
            question.status = AptitudeQuestion.STATUS_SUSPENDED
            question.save(update_fields=["status", "updated_at"])
            logger.warning(
                "Aptitude question %s automatically suspended due to %d issue reports.",
                question.id,
                active_reports_count,
            )

    return report, True


def admin_create_aptitude_question(
    admin_user, data: dict
) -> tuple[AptitudeQuestion, AptitudeQuestionVersion]:
    """
    Administrator creates a new question in the aptitude bank with initial version.
    """
    category = data.get("category", AptitudeQuestion.CATEGORY_QUANT)
    topic = data.get("topic", "General Aptitude")
    difficulty = data.get("difficulty", AptitudeQuestion.DIFFICULTY_MEDIUM)

    with transaction.atomic():
        q_obj, v_obj = store_and_validate_aptitude_question(
            category=category,
            topic=topic,
            difficulty=difficulty,
            content_data={
                "question_text": data.get("question_text", ""),
                "options": data.get("options", []),
                "correct_option_index": int(data.get("correct_option_index", 0)),
                "explanation": data.get("explanation", ""),
            },
        )
        q_obj.created_by = admin_user
        q_obj.save(update_fields=["created_by"])

        AdminActivityLog.objects.create(
            actor=admin_user,
            action="create_aptitude_question",
            resource_type="AptitudeQuestion",
            resource_id=str(q_obj.id),
            details={
                "category": category,
                "topic": topic,
                "version": v_obj.version_number,
            },
        )

    return q_obj, v_obj


def admin_publish_new_version(
    admin_user, question_id: str, data: dict
) -> AptitudeQuestionVersion:
    """
    Administrator updates an aptitude question by publishing a new immutable version.
    """
    question = AptitudeQuestion.objects.get(id=question_id)

    with transaction.atomic():
        last_version = question.versions.order_by("-version_number").first()
        next_version_num = (last_version.version_number + 1) if last_version else 1

        new_version = AptitudeQuestionVersion.objects.create(
            question=question,
            version_number=next_version_num,
            question_text=data["question_text"],
            options=data["options"],
            correct_option_index=int(data["correct_option_index"]),
            explanation=data["explanation"],
            validation_status=AptitudeQuestionVersion.VALIDATION_VALID,
            is_published=True,
        )

        question.question_text = new_version.question_text
        question.options = new_version.options
        question.correct_option_index = new_version.correct_option_index
        question.explanation = new_version.explanation
        question.status = AptitudeQuestion.STATUS_APPROVED
        question.save(
            update_fields=[
                "question_text",
                "options",
                "correct_option_index",
                "explanation",
                "status",
                "updated_at",
            ]
        )

        AdminActivityLog.objects.create(
            actor=admin_user,
            action="publish_aptitude_question_version",
            resource_type="AptitudeQuestionVersion",
            resource_id=str(new_version.id),
            details={
                "question_id": str(question.id),
                "version_number": next_version_num,
            },
        )

    return new_version


def admin_update_question_status(
    admin_user, question_id: str, new_status: str
) -> AptitudeQuestion:
    """
    Administrator changes operational status (approved, suspended, inactive).
    """
    question = AptitudeQuestion.objects.get(id=question_id)
    with transaction.atomic():
        old_status = question.status
        question.status = new_status
        question.is_active = new_status == AptitudeQuestion.STATUS_APPROVED
        question.save(update_fields=["status", "is_active", "updated_at"])

        AdminActivityLog.objects.create(
            actor=admin_user,
            action="update_aptitude_question_status",
            resource_type="AptitudeQuestion",
            resource_id=str(question.id),
            details={"old_status": old_status, "new_status": new_status},
        )
    return question


def admin_resolve_report(
    admin_user, report_id: str, action: str, admin_notes: str
) -> AptitudeQuestionReport:
    """
    Administrator resolves or dismisses a student question issue report.
    """
    report = AptitudeQuestionReport.objects.get(id=report_id)
    with transaction.atomic():
        report.status = (
            AptitudeQuestionReport.STATUS_RESOLVED
            if action == "resolve"
            else AptitudeQuestionReport.STATUS_DISMISSED
        )
        report.admin_notes = admin_notes
        report.save(update_fields=["status", "admin_notes", "updated_at"])

        AdminActivityLog.objects.create(
            actor=admin_user,
            action="resolve_aptitude_question_report",
            resource_type="AptitudeQuestionReport",
            resource_id=str(report.id),
            details={"action": action, "notes": admin_notes},
        )
    return report
