import uuid
from django.conf import settings
from django.db import models
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
    roadmap = models.ForeignKey(
        "learning.Roadmap",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="roadmap_id",
        related_name="quiz_assignments",
    )
    week_number = models.PositiveIntegerField()
    week = models.ForeignKey(
        "learning.RoadmapWeek",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quiz_assignments",
    )
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_PREPARING, db_index=True
    )
    preparation_job_id = models.UUIDField(null=True, blank=True)

    class Meta:
        ordering = ["week_number"]
        unique_together = ("roadmap", "week_number")

    def __str__(self):
        return (
            f"Quiz Week {self.week_number} (Roadmap {self.roadmap_id}) - {self.status}"
        )


class AssignmentQuestion(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(
        WeeklyQuizAssignment,
        on_delete=models.CASCADE,
        related_name="assignment_questions",
    )
    question_version = models.ForeignKey(
        "questions.QuestionVersion",
        on_delete=models.PROTECT,
        related_name="assignment_questions",
    )
    order = models.PositiveIntegerField()
    category = models.CharField(max_length=50)

    class Meta:
        unique_together = [("assignment", "order"), ("assignment", "question_version")]
        ordering = ["order"]

    def __str__(self):
        return f"Q{self.order} for Assignment {self.assignment_id}"


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
        max_length=30, choices=STATUS_CHOICES, default=STATUS_IN_PROGRESS, db_index=True
    )
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    score = models.FloatField(null=True, blank=True)
    correct_count = models.PositiveIntegerField(default=0)
    incorrect_count = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=45)
    evaluation_job_id = models.UUIDField(null=True, blank=True)

    class Meta:
        ordering = ["-attempt_number"]
        unique_together = ("assignment", "attempt_number")

    def __str__(self):
        return (
            f"Attempt #{self.attempt_number} for {self.assignment_id} ({self.status})"
        )


class AttemptAnswer(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(
        QuizAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    assignment_question = models.ForeignKey(
        AssignmentQuestion, on_delete=models.CASCADE, related_name="attempt_answers"
    )
    submitted_answer = models.TextField(blank=True)
    approach_explanation = models.TextField(blank=True)
    is_answered = models.BooleanField(default=False)
    is_correct = models.BooleanField(null=True, blank=True)
    evaluation_explanation = models.TextField(blank=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)
    question_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ("attempt", "assignment_question")
        ordering = ["assignment_question__order"]

    def __str__(self):
        return (
            f"Answer for Attempt {self.attempt_id} - Q{self.assignment_question.order}"
        )
