import uuid
from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class InterviewSession(TimeStampedModel):
    TYPE_TECHNICAL = "technical"
    TYPE_HR = "hr"
    TYPE_MIXED = "mixed"

    TYPE_CHOICES = [
        (TYPE_TECHNICAL, "Technical Interview"),
        (TYPE_HR, "HR Interview"),
        (TYPE_MIXED, "Mixed Recruitment Process"),
    ]

    RESULT_PASS = "pass"
    RESULT_FAIL = "fail"
    RESULT_IN_PROGRESS = "in_progress"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interviews"
    )
    interview_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    role = models.CharField(max_length=100)
    experience_level = models.CharField(max_length=50)
    salary_range = models.CharField(max_length=50)  # Mandatory in Practice
    language = models.CharField(max_length=50, blank=True)
    framework = models.CharField(max_length=50, blank=True)
    database = models.CharField(max_length=50, blank=True)
    final_result = models.CharField(max_length=20, default=RESULT_IN_PROGRESS)
    resume_version_reference = models.PositiveIntegerField(null=True, blank=True)
    cooling_period_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.interview_type} - {self.student.email} ({self.final_result})"
