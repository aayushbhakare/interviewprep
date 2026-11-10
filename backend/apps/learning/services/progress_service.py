from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from apps.learning.models import (
    Roadmap,
    RoadmapTopicReference,
    RoadmapPracticeTask,
    TopicProgress,
    PracticeTaskProgress,
)


def get_active_roadmap_stats(roadmap: Roadmap) -> dict:
    from apps.quizzes.models import WeeklyQuizAssignment, QuizAttempt

    # Learning topic stats
    total_topics = roadmap.topic_progresses.count()
    completed_topics = roadmap.topic_progresses.filter(
        status=TopicProgress.STATUS_COMPLETED
    ).count()
    skipped_topics = roadmap.topic_progresses.filter(
        status=TopicProgress.STATUS_SKIPPED
    ).count()
    not_started_topics = roadmap.topic_progresses.filter(
        status=TopicProgress.STATUS_NOT_STARTED
    ).count()

    # Weekly quiz submission milestones
    submitted_quiz_count = (
        WeeklyQuizAssignment.objects.filter(
            roadmap=roadmap,
            attempts__status__in=[
                QuizAttempt.STATUS_SUBMITTED,
                QuizAttempt.STATUS_EVALUATED,
                QuizAttempt.STATUS_PENDING,
            ],
        )
        .distinct()
        .count()
    )

    effective_total = total_topics + submitted_quiz_count
    effective_completed = completed_topics + submitted_quiz_count
    learning_pct = (
        int((effective_completed / effective_total) * 100) if effective_total > 0 else 0
    )

    learning_stats = {
        "total_topics": total_topics,
        "completed_topics": completed_topics,
        "skipped_topics": skipped_topics,
        "not_started_topics": not_started_topics,
        "submitted_quizzes": submitted_quiz_count,
        "effective_total": effective_total,
        "effective_completed": effective_completed,
        "progress_percentage": learning_pct,
        "display_progress": f"{effective_completed}/{effective_total}",
    }

    # Hands-on practice task stats
    total_tasks = roadmap.practice_progresses.count()
    completed_tasks = roadmap.practice_progresses.filter(
        status=PracticeTaskProgress.STATUS_COMPLETED
    ).count()
    in_progress_tasks = roadmap.practice_progresses.filter(
        status=PracticeTaskProgress.STATUS_IN_PROGRESS
    ).count()
    not_started_tasks = roadmap.practice_progresses.filter(
        status=PracticeTaskProgress.STATUS_NOT_STARTED
    ).count()
    practice_pct = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0

    practice_stats = {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "in_progress_tasks": in_progress_tasks,
        "not_started_tasks": not_started_tasks,
        "progress_percentage": practice_pct,
        "display_progress": f"{completed_tasks}/{total_tasks}",
    }

    return {
        **learning_stats,
        "learning_stats": learning_stats,
        "practice_stats": practice_stats,
    }


def update_topic_progress(user, topic_id, new_status: str) -> dict:
    valid_statuses = [
        TopicProgress.STATUS_NOT_STARTED,
        TopicProgress.STATUS_COMPLETED,
        TopicProgress.STATUS_SKIPPED,
    ]
    if new_status not in valid_statuses:
        raise ValidationError(
            {"status": [f"Status must be one of: {', '.join(valid_statuses)}"]}
        )

    try:
        topic_ref = RoadmapTopicReference.objects.select_related(
            "week__phase__roadmap"
        ).get(id=topic_id)
    except (RoadmapTopicReference.DoesNotExist, ValueError):
        raise NotFound({"detail": "Roadmap topic not found."})

    roadmap = topic_ref.week.phase.roadmap
    if roadmap.user_id != user.id or not roadmap.is_active:
        raise PermissionDenied(
            {"detail": "You do not have permission to modify this roadmap topic."}
        )

    progress_record, _ = TopicProgress.objects.get_or_create(
        roadmap=roadmap,
        topic=topic_ref,
        defaults={"status": TopicProgress.STATUS_NOT_STARTED},
    )

    progress_record.status = new_status
    if new_status == TopicProgress.STATUS_COMPLETED:
        progress_record.completed_at = timezone.now()
    else:
        progress_record.completed_at = None

    progress_record.save(update_fields=["status", "completed_at", "updated_at"])

    stats = get_active_roadmap_stats(roadmap)
    return {
        "topic_id": str(topic_ref.id),
        "status": progress_record.status,
        "completed_at": progress_record.completed_at.isoformat()
        if progress_record.completed_at
        else None,
        "roadmap_stats": stats,
    }


def update_practice_progress(
    user, task_id, new_status: str, submission_notes: str | None = None
) -> dict:
    valid_statuses = [
        PracticeTaskProgress.STATUS_NOT_STARTED,
        PracticeTaskProgress.STATUS_IN_PROGRESS,
        PracticeTaskProgress.STATUS_COMPLETED,
    ]
    if new_status not in valid_statuses:
        raise ValidationError(
            {"status": [f"Status must be one of: {', '.join(valid_statuses)}"]}
        )

    try:
        task = RoadmapPracticeTask.objects.select_related("week__phase__roadmap").get(
            id=task_id
        )
    except (RoadmapPracticeTask.DoesNotExist, ValueError):
        raise NotFound({"detail": "Practice task not found."})

    roadmap = task.week.phase.roadmap
    if roadmap.user_id != user.id or not roadmap.is_active:
        raise PermissionDenied(
            {"detail": "You do not have permission to modify this practice task."}
        )

    progress_record, _ = PracticeTaskProgress.objects.get_or_create(
        roadmap=roadmap,
        task=task,
        defaults={"status": PracticeTaskProgress.STATUS_NOT_STARTED},
    )

    progress_record.status = new_status
    if submission_notes is not None:
        progress_record.submission_notes = submission_notes

    if new_status == PracticeTaskProgress.STATUS_COMPLETED:
        progress_record.completed_at = timezone.now()
    else:
        progress_record.completed_at = None

    update_fields = ["status", "completed_at", "updated_at"]
    if submission_notes is not None:
        update_fields.append("submission_notes")
    progress_record.save(update_fields=update_fields)

    stats = get_active_roadmap_stats(roadmap)
    return {
        "task_id": str(task.id),
        "status": progress_record.status,
        "submission_notes": progress_record.submission_notes,
        "completed_at": progress_record.completed_at.isoformat()
        if progress_record.completed_at
        else None,
        "roadmap_stats": stats,
    }
