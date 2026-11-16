import uuid
from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class WeeklyQuizAssignment(TimeStampedModel):
    STATUS_PREPARING = "preparing"
    STATUS_READY = "ready"
    STATUS_UNAVAILABLE = "temporarily_unavailable"

    STATUS_CHOICES = [
        (STATUS_PREPARING, "Preparing"),
        (STATUS_READY, "Ready"),
        (STATUS_UNAVAILABLE, "Temporarily Unavailable"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_assignments",
    )
    week_number = models.PositiveIntegerField()
    roadmap_id = models.UUIDField(db_index=True)
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_PREPARING
    )


class QuizAttempt(TimeStampedModel):
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_ABANDONED = "abandoned"
    STATUS_SUBMITTED = "submitted"
    STATUS_PENDING = "evaluation_pending"
    STATUS_EVALUATED = "evaluated"

    STATUS_CHOICES = [
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_ABANDONED, "Abandoned"),
        (STATUS_SUBMITTED, "Submitted"),
        (STATUS_PENDING, "Evaluation Pending"),
        (STATUS_EVALUATED, "Evaluated"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(
        WeeklyQuizAssignment, on_delete=models.CASCADE, related_name="attempts"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    attempt_number = models.PositiveIntegerField()
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_IN_PROGRESS
    )
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    correct_count = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=45)

    class Meta:
        ordering = ["-attempt_number"]
