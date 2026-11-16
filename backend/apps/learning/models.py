import uuid
from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class Roadmap(TimeStampedModel):
    STATUS_PREPARING = "preparing"
    STATUS_READY = "ready"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PREPARING, "Preparing"),
        (STATUS_READY, "Ready"),
        (STATUS_FAILED, "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="roadmaps"
    )
    role = models.CharField(max_length=100)
    experience_level = models.CharField(max_length=50)
    target_salary = models.CharField(max_length=50, blank=True, null=True)
    language = models.CharField(max_length=50)
    framework = models.CharField(max_length=50)
    database = models.CharField(max_length=50)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PREPARING
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.role} ({self.status})"
