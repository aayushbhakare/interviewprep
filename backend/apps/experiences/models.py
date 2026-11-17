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
    company_location = models.CharField(max_length=150, blank=True)
    recruitment_year = models.IntegerField(null=True, blank=True)
    job_type = models.CharField(
        max_length=50, blank=True
    )  # Full-time, Internship, Contract
    interview_mode = models.CharField(
        max_length=50, blank=True
    )  # Online, Offline, Hybrid
    overall_difficulty = models.CharField(
        max_length=30, blank=True
    )  # Easy, Medium, Hard, Very Hard
    overall_outcome = models.CharField(max_length=30, choices=OUTCOME_CHOICES)
    additional_context = models.TextField(blank=True)

    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True
    )
    rejection_reason = models.TextField(blank=True)
    helpful_votes_count = models.PositiveIntegerField(default=0)
    reports_count = models.PositiveIntegerField(default=0)
    is_hidden = models.BooleanField(default=False, db_index=True)
    hidden_reason = models.CharField(max_length=255, blank=True)
    published_version = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "is_hidden", "-created_at"]),
            models.Index(fields=["company_name", "role"]),
        ]

    def __str__(self):
        return f"{self.company_name} - {self.role} ({self.status})"


class ExperienceVersion(TimeStampedModel):
    STATUS_DRAFT = "draft"
    STATUS_PENDING_REVIEW = "pending_review"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PENDING_REVIEW, "Pending Review"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    experience = models.ForeignKey(
        InterviewExperience, on_delete=models.CASCADE, related_name="versions"
    )
    version_number = models.PositiveIntegerField(default=1)
    is_published = models.BooleanField(default=False)
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_DRAFT
    )
    snapshot_data = models.JSONField(default=dict)
    moderation_result = models.JSONField(default=dict)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-version_number"]
        unique_together = ("experience", "version_number")

    def __str__(self):
        return f"{self.experience_id} v{self.version_number} ({self.status})"


class ExperienceStage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    experience = models.ForeignKey(
        InterviewExperience, on_delete=models.CASCADE, related_name="stages"
    )
    stage_type = models.CharField(
        max_length=50
    )  # application, aptitude_test, technical_1, hr, custom...
    custom_stage_name = models.CharField(max_length=100, blank=True)
    order = models.PositiveIntegerField(default=1)
    stage_date = models.DateField(null=True, blank=True)
    stage_time = models.CharField(max_length=50, blank=True)
    time_gap = models.CharField(max_length=100, blank=True)
    interview_mode = models.CharField(max_length=50, blank=True)
    difficulty = models.CharField(max_length=30, blank=True)
    result = models.CharField(max_length=50, blank=True)
    advanced = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    additional_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        name = self.custom_stage_name or self.stage_type
        return f"{self.experience_id} - Stage {self.order}: {name}"


class StageQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stage = models.ForeignKey(
        ExperienceStage, on_delete=models.CASCADE, related_name="questions"
    )
    question_text = models.TextField()
    follow_up_text = models.TextField(blank=True)
    interviewer_approach = models.TextField(blank=True)
    student_response = models.TextField(blank=True)
    difficulty = models.CharField(max_length=30, blank=True)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}"


class ExperienceHelpfulVote(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="experience_votes",
    )
    experience = models.ForeignKey(
        InterviewExperience, on_delete=models.CASCADE, related_name="helpful_votes"
    )

    class Meta:
        unique_together = ("user", "experience")

    def __str__(self):
        return f"{self.user_id} helpful vote on {self.experience_id}"


class ExperienceReport(TimeStampedModel):
    REASON_FAKE = "fake"
    REASON_SPAM = "spam"
    REASON_INAPPROPRIATE = "inappropriate"
    REASON_PII = "pii"
    REASON_DUPLICATE = "duplicate"
    REASON_INCORRECT = "incorrect"
    REASON_OTHER = "other"

    REASON_CHOICES = [
        (REASON_FAKE, "Fake or misleading experience"),
        (REASON_SPAM, "Spam or promotional content"),
        (REASON_INAPPROPRIATE, "Inappropriate content"),
        (REASON_PII, "Personal information exposure"),
        (REASON_DUPLICATE, "Duplicate experience"),
        (REASON_INCORRECT, "Incorrect or harmful information"),
        (REASON_OTHER, "Other"),
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
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submitted_experience_reports",
    )
    experience = models.ForeignKey(
        InterviewExperience, on_delete=models.CASCADE, related_name="reports"
    )
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    explanation = models.TextField(blank=True)
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    admin_notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("reporter", "experience")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report by {self.reporter_id} on {self.experience_id} ({self.reason})"


class StudentReportedQuestion(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_experience = models.ForeignKey(
        InterviewExperience, on_delete=models.CASCADE, related_name="reported_questions"
    )
    source_stage = models.ForeignKey(
        ExperienceStage, on_delete=models.SET_NULL, null=True, blank=True
    )
    source_question = models.ForeignKey(
        StageQuestion, on_delete=models.SET_NULL, null=True, blank=True
    )
    question_text = models.TextField()
    follow_up_text = models.TextField(blank=True)
    role = models.CharField(max_length=100)
    technology = models.CharField(max_length=100, db_index=True)
    topic_slug = models.CharField(max_length=150, db_index=True, blank=True)
    stage_type = models.CharField(max_length=50, blank=True)
    salary_range = models.CharField(max_length=50, blank=True)
    company_name = models.CharField(max_length=200, blank=True)
    report_count = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["-report_count", "-created_at"]

    def __str__(self):
        return f"{self.technology}: {self.question_text[:50]}"
