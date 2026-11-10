import uuid
from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class AIUsageRecord(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    provider = models.CharField(max_length=50, default="gemini")
    feature = models.CharField(
        max_length=100, db_index=True
    )  # e.g. roadmap_generation, quiz_evaluation, interview_turn
    model_name = models.CharField(max_length=100)
    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    total_tokens = models.PositiveIntegerField(default=0)
    estimated_cost_usd = models.DecimalField(
        max_digits=10, decimal_places=6, default=0.0
    )
    status = models.CharField(max_length=20, default="success")
    latency_ms = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.feature} - {self.model_name} ({self.status}) [{self.total_tokens} tokens]"
