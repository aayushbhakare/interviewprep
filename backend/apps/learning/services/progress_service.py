from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from apps.learning.models import Roadmap, RoadmapTopicReference, TopicProgress


def get_active_roadmap_stats(roadmap: Roadmap) -> dict:
    total = roadmap.topic_progresses.count()
    completed = roadmap.topic_progresses.filter(status=TopicProgress.STATUS_COMPLETED).count()
    skipped = roadmap.topic_progresses.filter(status=TopicProgress.STATUS_SKIPPED).count()
    not_started = roadmap.topic_progresses.filter(status=TopicProgress.STATUS_NOT_STARTED).count()
    pct = int((completed / total) * 100) if total > 0 else 0

    return {
        "total_topics": total,
        "completed_topics": completed,
        "skipped_topics": skipped,
        "not_started_topics": not_started,
        "progress_percentage": pct,
        "display_progress": f"{completed}/{total}",
    }


def update_topic_progress(user, topic_id, new_status: str) -> dict:
    valid_statuses = [
        TopicProgress.STATUS_NOT_STARTED,
        TopicProgress.STATUS_COMPLETED,
        TopicProgress.STATUS_SKIPPED,
    ]
    if new_status not in valid_statuses:
        raise ValidationError({"status": [f"Status must be one of: {', '.join(valid_statuses)}"]})

    try:
        topic_ref = RoadmapTopicReference.objects.select_related("week__phase__roadmap").get(id=topic_id)
    except (RoadmapTopicReference.DoesNotExist, ValueError):
        raise NotFound({"detail": "Roadmap topic not found."})

    roadmap = topic_ref.week.phase.roadmap
    if roadmap.user_id != user.id or not roadmap.is_active:
        raise PermissionDenied({"detail": "You do not have permission to modify this roadmap topic."})

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
        "completed_at": progress_record.completed_at.isoformat() if progress_record.completed_at else None,
        "roadmap_stats": stats,
    }
