import uuid
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
        (CATEGORY_DEBUGGING, "Find the Error & Debugging"),
        (CATEGORY_CODING, "Coding Problems"),
        (CATEGORY_SCENARIO, "Scenario-Based Questions"),
        (CATEGORY_CONCEPTUAL, "Conceptual & Short-Answer"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    technology = models.CharField(max_length=100, db_index=True)
    topic_slug = models.SlugField(max_length=200, db_index=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    difficulty = models.CharField(max_length=20, default="medium")
    current_version_number = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"[{self.category}] {self.technology} - {self.topic_slug}"


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
    rubric = models.JSONField(default=dict)
    expected_output = models.TextField(blank=True)
    validation_status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_APPROVED
    )

    class Meta:
        unique_together = ("question", "version_number")
