import uuid
from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class InterviewExperience(TimeStampedModel):
    OUTCOME_SELECTED = "selected"
    OUTCOME_REJECTED = "rejected"
    OUTCOME_AWAITED = "result_awaited"
    OUTCOME_WITHDREW = "withdrew"

    OUTCOME_CHOICES = [
        (OUTCOME_SELECTED, "Selected"),
        (OUTCOME_REJECTED, "Rejected"),
        (OUTCOME_AWAITED, "Result Awaited"),
        (OUTCOME_WITHDREW, "Withdrew / Did not complete"),
    ]

    STATUS_DRAFT = "draft"
    STATUS_PENDING_REVIEW = "pending_review"
    STATUS_PUBLISHED = "published"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PENDING_REVIEW, "Pending Review"),
        (STATUS_PUBLISHED, "Published"),
        (STATUS_REJECTED, "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="experiences"
    )
    is_anonymous = models.BooleanField(default=False)
    company_name = models.CharField(max_length=200, db_index=True)
    role = models.CharField(max_length=100, db_index=True)
    experience_level = models.CharField(max_length=50)
    salary_range = models.CharField(max_length=50, blank=True)
    overall_outcome = models.CharField(max_length=30, choices=OUTCOME_CHOICES)
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True
    )
    helpful_votes_count = models.PositiveIntegerField(default=0)
    published_version = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company_name} - {self.role} ({self.status})"
