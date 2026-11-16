import hashlib
import uuid
from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel


class Question(TimeStampedModel):
    CATEGORY_OUTPUT = "output_prediction"
    CATEGORY_DEBUGGING = "error_debugging"
    CATEGORY_CODING = "coding"
    CATEGORY_SCENARIO = "scenario"
    CATEGORY_CONCEPTUAL = "conceptual"

    CATEGORY_CHOICES = [
        (CATEGORY_OUTPUT, "Code Output Prediction"),
        (CATEGORY_DEBUGGING, "Find Error / Debugging"),
        (CATEGORY_CODING, "Coding Problems"),
        (CATEGORY_SCENARIO, "Scenario-Based Questions"),
        (CATEGORY_CONCEPTUAL, "Conceptual / Short Answer"),
    ]

    DIFFICULTY_EASY = "easy"
    DIFFICULTY_MEDIUM = "medium"
    DIFFICULTY_HARD = "hard"

    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, "Easy"),
        (DIFFICULTY_MEDIUM, "Medium"),
        (DIFFICULTY_HARD, "Hard"),
    ]

    STATUS_APPROVED = "approved"
    STATUS_SUSPENDED = "suspended"
    STATUS_INACTIVE = "inactive"

    STATUS_CHOICES = [
        (STATUS_APPROVED, "Approved"),
        (STATUS_SUSPENDED, "Suspended – Review Failed"),
        (STATUS_INACTIVE, "Inactive"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    technology = models.CharField(max_length=100, db_index=True)
    topic_slug = models.SlugField(max_length=200, db_index=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default=DIFFICULTY_MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_APPROVED, db_index=True
    )
    current_version_number = models.PositiveIntegerField(default=1)
    times_assigned = models.PositiveIntegerField(default=0)
    times_attempted = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.category}] {self.technology} - {self.topic_slug}"

    @property
    def latest_version(self):
        return (
            self.versions.filter(version_number=self.current_version_number).first()
            or self.versions.order_by("-version_number").first()
        )


class QuestionVersion(TimeStampedModel):
    STATUS_APPROVED = "approved"
    STATUS_UNDER_REVIEW = "under_review"
    STATUS_SUSPENDED = "suspended"

    STATUS_CHOICES = [
        (STATUS_APPROVED, "Approved"),
        (STATUS_UNDER_REVIEW, "Under AI Review"),
        (STATUS_SUSPENDED, "Suspended – Review Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="versions"
    )
    version_number = models.PositiveIntegerField()
    prompt = models.TextField()
    code_snippet = models.TextField(blank=True)
    expected_answer = models.TextField(blank=True)
    evaluation_rubric = models.JSONField(default=dict, blank=True)
    explanation = models.TextField(blank=True)
    starter_code = models.TextField(blank=True)
    test_cases = models.JSONField(default=list, blank=True)
    validation_status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_APPROVED
    )
    change_reason = models.TextField(blank=True)

    class Meta:
        unique_together = ("question", "version_number")
        ordering = ["question", "version_number"]

    def __str__(self):
        return f"{self.question} (v{self.version_number})"


class QuestionReport(TimeStampedModel):
    REASON_INCORRECT_ANSWER = "incorrect_answer"
    REASON_INCORRECT_EXPLANATION = "incorrect_explanation"
    REASON_AMBIGUOUS_WORDING = "ambiguous_wording"
    REASON_DUPLICATE_QUESTION = "duplicate_question"
    REASON_INCORRECT_DIFFICULTY = "incorrect_difficulty"
    REASON_TECHNICAL_ISSUE = "technical_issue"

    REASON_CHOICES = [
        (REASON_INCORRECT_ANSWER, "Incorrect Answer"),
        (REASON_INCORRECT_EXPLANATION, "Incorrect Explanation"),
        (REASON_AMBIGUOUS_WORDING, "Ambiguous Wording"),
        (REASON_DUPLICATE_QUESTION, "Duplicate Question"),
        (REASON_INCORRECT_DIFFICULTY, "Incorrect Difficulty"),
        (REASON_TECHNICAL_ISSUE, "Technical Issue"),
    ]

    STATUS_PENDING = "pending"
    STATUS_REVIEWED = "reviewed"
    STATUS_RESOLVED = "resolved"
    STATUS_DISMISSED = "dismissed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending Review"),
        (STATUS_REVIEWED, "Reviewed"),
        (STATUS_RESOLVED, "Resolved"),
        (STATUS_DISMISSED, "Dismissed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="reports"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="question_reports",
    )
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField()
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    admin_notes = models.TextField(blank=True)
    duplicate_group_hash = models.CharField(max_length=64, blank=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.duplicate_group_hash:
            raw = f"{self.question_id}:{self.reason}"
            self.duplicate_group_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Report on {self.question_id} by {self.student_id} ({self.reason})"


class QuestionValidationHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question_version = models.ForeignKey(
        QuestionVersion, on_delete=models.CASCADE, related_name="validation_records"
    )
    attempt_number = models.PositiveIntegerField(default=1)
    is_valid = models.BooleanField(default=True)
    failure_reason = models.TextField(blank=True)
    validation_details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Validation {self.attempt_number} for {self.question_version_id}: valid={self.is_valid}"
