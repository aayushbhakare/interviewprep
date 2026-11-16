import uuid
from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class AptitudeQuestion(TimeStampedModel):
    CATEGORY_QUANT = "quantitative"
    CATEGORY_LOGICAL = "logical"
    CATEGORY_VERBAL = "verbal"

    CATEGORY_CHOICES = [
        (CATEGORY_QUANT, "Quantitative Aptitude"),
        (CATEGORY_LOGICAL, "Logical Reasoning"),
        (CATEGORY_VERBAL, "Verbal Ability"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    question_text = models.TextField()
    options = models.JSONField(default=list)  # List of 4 options
    correct_option_index = models.PositiveSmallIntegerField()
    explanation = models.TextField()
    is_active = models.BooleanField(default=True)


class AptitudeSession(TimeStampedModel):
    TYPE_STANDALONE = "standalone"
    TYPE_MIXED_STAGE = "mixed_stage"

    STATUS_IN_PROGRESS = "in_progress"
    STATUS_ABANDONED = "abandoned"
    STATUS_SUBMITTED = "submitted"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="aptitude_sessions",
    )
    session_type = models.CharField(
        max_length=20, default=TYPE_STANDALONE, db_index=True
    )
    status = models.CharField(max_length=20, default=STATUS_IN_PROGRESS, db_index=True)
    score = models.FloatField(null=True, blank=True)
    total_marks = models.PositiveIntegerField(default=0)
    percentage = models.FloatField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
