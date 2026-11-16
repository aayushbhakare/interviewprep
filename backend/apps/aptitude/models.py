import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
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

    DIFFICULTY_EASY = "easy"
    DIFFICULTY_MEDIUM = "medium"
    DIFFICULTY_HARD = "hard"

    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, "Easy"),
        (DIFFICULTY_MEDIUM, "Medium"),
        (DIFFICULTY_HARD, "Hard"),
    ]

    STATUS_DRAFT = "draft"
    STATUS_APPROVED = "approved"
    STATUS_SUSPENDED = "suspended"
    STATUS_INACTIVE = "inactive"
    STATUS_REVIEW_FAILED = "review_failed"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_INACTIVE, "Inactive"),
        (STATUS_REVIEW_FAILED, "Review Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    topic = models.CharField(max_length=100, default="General Aptitude", db_index=True)
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default=DIFFICULTY_MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_APPROVED,
        db_index=True,
    )
    question_text = models.TextField()
    options = models.JSONField(default=list)  # List of 4 option strings
    correct_option_index = models.PositiveSmallIntegerField()  # 0, 1, 2, or 3
    explanation = models.TextField()
    is_active = models.BooleanField(default=True)
    times_assigned = models.PositiveIntegerField(default=0)
    times_attempted = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_aptitude_questions",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.category}] {self.topic}: {self.question_text[:50]}"


class AptitudeQuestionVersion(TimeStampedModel):
    VALIDATION_VALID = "valid"
    VALIDATION_INVALID = "invalid"
    VALIDATION_REVIEW_FAILED = "review_failed"

    VALIDATION_CHOICES = [
        (VALIDATION_VALID, "Valid"),
        (VALIDATION_INVALID, "Invalid"),
        (VALIDATION_REVIEW_FAILED, "Review Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        AptitudeQuestion, on_delete=models.CASCADE, related_name="versions"
    )
    version_number = models.PositiveIntegerField(default=1)
    question_text = models.TextField()
    options = models.JSONField(default=list)  # List of 4 options
    correct_option_index = models.PositiveSmallIntegerField()
    explanation = models.TextField()
    validation_status = models.CharField(
        max_length=20, choices=VALIDATION_CHOICES, default=VALIDATION_VALID
    )
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["question", "-version_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["question", "version_number"],
                name="unique_aptitude_question_version",
            )
        ]

    def __str__(self):
        return f"Question {self.question_id} v{self.version_number}"


class AptitudeQuestionReport(TimeStampedModel):
    REASON_INCORRECT = "incorrect_answer"
    REASON_AMBIGUOUS = "ambiguous_options"
    REASON_TYPO = "typo_grammar"
    REASON_OTHER = "other"

    REASON_CHOICES = [
        (REASON_INCORRECT, "Incorrect Answer"),
        (REASON_AMBIGUOUS, "Ambiguous Options"),
        (REASON_TYPO, "Typo or Grammar Error"),
        (REASON_OTHER, "Other Issue"),
    ]

    STATUS_PENDING = "pending"
    STATUS_REVIEWED = "reviewed"
    STATUS_RESOLVED = "resolved"
    STATUS_DISMISSED = "dismissed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_REVIEWED, "Reviewed"),
        (STATUS_RESOLVED, "Resolved"),
        (STATUS_DISMISSED, "Dismissed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        AptitudeQuestion, on_delete=models.CASCADE, related_name="reports"
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="aptitude_reports",
    )
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    admin_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report {self.id} for {self.question_id} ({self.status})"


class AptitudeValidationHistory(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        AptitudeQuestion, on_delete=models.CASCADE, related_name="validation_history"
    )
    version_number = models.PositiveIntegerField(default=1)
    revision_count = models.PositiveIntegerField(default=0)
    is_valid = models.BooleanField(default=True)
    failure_reason = models.TextField(blank=True)
    validation_payload = models.JSONField(default=dict)

    class Meta:
        ordering = ["-created_at"]


class AptitudeTestConfig(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, default="Standard Cognitive Foundation Assessment")
    total_questions = models.PositiveIntegerField(default=45)
    duration_minutes = models.PositiveIntegerField(default=60)
    distribution = models.JSONField(
        default=dict
    )  # {"quantitative": 15, "logical": 15, "verbal": 15}
    daily_limit = models.PositiveIntegerField(default=5)
    mixed_qualifying_cutoff = models.FloatField(default=60.0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.total_questions}Q, {self.duration_minutes}m)"

    @classmethod
    def get_active_config(cls):
        config = cls.objects.filter(is_active=True).first()
        if not config:
            config = cls.objects.create(
                name="Standard Cognitive Foundation Assessment",
                total_questions=45,
                duration_minutes=60,
                distribution={"quantitative": 15, "logical": 15, "verbal": 15},
                daily_limit=5,
                mixed_qualifying_cutoff=60.0,
                is_active=True,
            )
        return config


class AptitudeSession(TimeStampedModel):
    TYPE_STANDALONE = "standalone"
    TYPE_MIXED_STAGE = "mixed_stage"

    SESSION_TYPE_CHOICES = [
        (TYPE_STANDALONE, "Standalone Practice"),
        (TYPE_MIXED_STAGE, "Mixed Interview Stage"),
    ]

    STATUS_IN_PROGRESS = "in_progress"
    STATUS_ABANDONED = "abandoned"
    STATUS_SUBMITTED = "submitted"

    STATUS_CHOICES = [
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_ABANDONED, "Abandoned"),
        (STATUS_SUBMITTED, "Submitted"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="aptitude_sessions",
    )
    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPE_CHOICES,
        default=TYPE_STANDALONE,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_IN_PROGRESS,
        db_index=True,
    )
    score = models.FloatField(null=True, blank=True)
    total_marks = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveIntegerField(default=0)
    incorrect_count = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=45)
    percentage = models.FloatField(null=True, blank=True)
    started_at = models.DateTimeField(default=timezone.now)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    test_config_snapshot = models.JSONField(default=dict)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"AptitudeSession {self.id} ({self.student.email} - {self.status})"


class AptitudeSessionQuestion(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        AptitudeSession, on_delete=models.CASCADE, related_name="session_questions"
    )
    question = models.ForeignKey(
        AptitudeQuestion, on_delete=models.CASCADE, related_name="session_appearances"
    )
    question_version = models.ForeignKey(
        AptitudeQuestionVersion, on_delete=models.CASCADE
    )
    order = models.PositiveIntegerField()
    question_snapshot = models.JSONField(default=dict)

    class Meta:
        ordering = ["session", "order"]
        constraints = [
            models.UniqueConstraint(
                fields=["session", "order"],
                name="unique_aptitude_session_question_order",
            )
        ]

    def __str__(self):
        return f"Session {self.session_id} Q{self.order}"


class AptitudeSessionAnswer(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        AptitudeSession, on_delete=models.CASCADE, related_name="answers"
    )
    session_question = models.ForeignKey(
        AptitudeSessionQuestion, on_delete=models.CASCADE, related_name="answer"
    )
    selected_option_index = models.PositiveSmallIntegerField(null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["session", "session_question__order"]
        constraints = [
            models.UniqueConstraint(
                fields=["session", "session_question"],
                name="unique_aptitude_session_answer",
            )
        ]

    def __str__(self):
        return f"Answer for Session {self.session_id} Q{self.session_question.order}"
