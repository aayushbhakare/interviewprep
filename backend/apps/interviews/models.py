import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
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

    STATUS_CREATED = "created"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_ABANDONED = "abandoned"

    STATUS_CHOICES = [
        (STATUS_CREATED, "Created"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_ABANDONED, "Abandoned"),
    ]

    RESULT_PENDING = "pending"
    RESULT_PASS = "pass"
    RESULT_FAIL = "fail"
    RESULT_ABANDONED = "abandoned"

    RESULT_CHOICES = [
        (RESULT_PENDING, "Pending"),
        (RESULT_PASS, "Pass"),
        (RESULT_FAIL, "Fail"),
        (RESULT_ABANDONED, "Abandoned"),
    ]

    EVAL_NOT_STARTED = "not_started"
    EVAL_PENDING = "pending"
    EVAL_COMPLETED = "completed"
    EVAL_FAILED = "failed"

    EVAL_CHOICES = [
        (EVAL_NOT_STARTED, "Not Started"),
        (EVAL_PENDING, "Pending"),
        (EVAL_COMPLETED, "Completed"),
        (EVAL_FAILED, "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interviews"
    )
    interview_type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, db_index=True
    )
    role = models.CharField(max_length=100)
    experience_level = models.CharField(max_length=50)
    salary_range = models.CharField(max_length=50)
    language = models.CharField(max_length=50, blank=True)
    framework = models.CharField(max_length=50, blank=True)
    database = models.CharField(max_length=50, blank=True)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_IN_PROGRESS, db_index=True
    )
    final_result = models.CharField(
        max_length=20, choices=RESULT_CHOICES, default=RESULT_PENDING, db_index=True
    )
    evaluation_status = models.CharField(
        max_length=20, choices=EVAL_CHOICES, default=EVAL_NOT_STARTED, db_index=True
    )

    resume_version_reference = models.PositiveIntegerField(null=True, blank=True)
    resume_snapshot = models.JSONField(default=dict, blank=True)
    ai_conversation_state = models.JSONField(default=dict, blank=True)
    overall_feedback = models.JSONField(default=dict, blank=True)
    cooling_period_until = models.DateTimeField(null=True, blank=True, db_index=True)

    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student", "interview_type", "status"]),
            models.Index(fields=["final_result", "created_at"]),
        ]

    def __str__(self):
        return f"{self.interview_type} - {self.student.email} ({self.final_result})"


class InterviewRound(TimeStampedModel):
    ROUND_APTITUDE = "aptitude"
    ROUND_TECHNICAL_1 = "technical_1"
    ROUND_TECHNICAL_2 = "technical_2"
    ROUND_HR = "hr"

    ROUND_TYPE_CHOICES = [
        (ROUND_APTITUDE, "Aptitude Assessment"),
        (ROUND_TECHNICAL_1, "Technical Round 1"),
        (ROUND_TECHNICAL_2, "Technical Round 2"),
        (ROUND_HR, "HR Round"),
    ]

    STATUS_PENDING = "pending"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_NOT_ATTEMPTED = "not_attempted"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_NOT_ATTEMPTED, "Not Attempted"),
    ]

    RESULT_PENDING = "pending"
    RESULT_PASS = "pass"
    RESULT_FAIL = "fail"

    RESULT_CHOICES = [
        (RESULT_PENDING, "Pending"),
        (RESULT_PASS, "Pass"),
        (RESULT_FAIL, "Fail"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        InterviewSession, on_delete=models.CASCADE, related_name="rounds"
    )
    round_number = models.PositiveIntegerField()
    round_type = models.CharField(max_length=20, choices=ROUND_TYPE_CHOICES)
    round_name = models.CharField(max_length=150)
    round_description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    result = models.CharField(
        max_length=20, choices=RESULT_CHOICES, default=RESULT_PENDING, db_index=True
    )

    aptitude_session = models.ForeignKey(
        "aptitude.AptitudeSession",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="interview_rounds",
    )
    ai_conversation_state = models.JSONField(default=dict, blank=True)
    feedback = models.JSONField(default=dict, blank=True)

    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["session", "round_number"]
        unique_together = ("session", "round_number")
        indexes = [
            models.Index(fields=["session", "status"]),
        ]

    def __str__(self):
        return f"{self.session.id} - R{self.round_number} ({self.round_type}): {self.result}"


class InterviewCoolingPeriod(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interview_cooling_periods",
    )
    interview_type = models.CharField(
        max_length=20, choices=InterviewSession.TYPE_CHOICES, db_index=True
    )
    expires_at = models.DateTimeField(db_index=True)
    failed_session = models.ForeignKey(
        InterviewSession,
        on_delete=models.CASCADE,
        related_name="cooling_records",
    )

    class Meta:
        unique_together = ("user", "interview_type")
        indexes = [
            models.Index(fields=["user", "interview_type", "expires_at"]),
        ]

    def __str__(self):
        return f"Cooling for {self.user.email} [{self.interview_type}] until {self.expires_at}"

    @property
    def is_active(self):
        return timezone.now() < self.expires_at

    @property
    def remaining_seconds(self):
        if not self.is_active:
            return 0
        return int((self.expires_at - timezone.now()).total_seconds())


class InterviewConfig(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, default="Global Interview Configuration")
    technical_cooling_hours = models.PositiveIntegerField(default=24)
    hr_cooling_hours = models.PositiveIntegerField(default=24)
    mixed_cooling_hours = models.PositiveIntegerField(default=24)
    mixed_aptitude_cutoff = models.FloatField(default=60.0)
    default_provider = models.CharField(max_length=50, default="gemini")
    default_model = models.CharField(max_length=100, default="gemini-2.0-flash")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} (Tech: {self.technical_cooling_hours}h, HR: {self.hr_cooling_hours}h, Mixed: {self.mixed_cooling_hours}h)"

    @classmethod
    def get_active_config(cls):
        config = cls.objects.filter(is_active=True).first()
        if not config:
            config = cls.objects.create(
                name="Global Interview Configuration",
                technical_cooling_hours=24,
                hr_cooling_hours=24,
                mixed_cooling_hours=24,
                mixed_aptitude_cutoff=60.0,
                default_provider="gemini",
                default_model="gemini-2.0-flash",
                is_active=True,
            )
        return config
