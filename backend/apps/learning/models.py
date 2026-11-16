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
    framework = models.CharField(max_length=50, blank=True, null=True)
    database = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PREPARING
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.role} ({self.status})"


class RoadmapConfigurationSnapshot(models.Model):
    roadmap = models.OneToOneField(
        Roadmap, on_delete=models.CASCADE, related_name="configuration_snapshot"
    )
    role = models.CharField(max_length=100)
    experience_level = models.CharField(max_length=50)
    target_salary = models.CharField(max_length=50, blank=True, null=True)
    language = models.CharField(max_length=50)
    framework = models.CharField(max_length=50, blank=True, null=True)
    database = models.CharField(max_length=50, blank=True, null=True)
    custom_role = models.CharField(max_length=150, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Config snapshot for {self.roadmap_id}"


class RoadmapPhase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    roadmap = models.ForeignKey(
        Roadmap, on_delete=models.CASCADE, related_name="phases"
    )
    phase_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["phase_number"]

    def __str__(self):
        return f"Phase {self.phase_number}: {self.title}"


class RoadmapWeek(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phase = models.ForeignKey(
        RoadmapPhase, on_delete=models.CASCADE, related_name="weeks"
    )
    week_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    goal = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["week_number"]

    def __str__(self):
        return f"Week {self.week_number}: {self.title}"


class RoadmapTopicReference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    week = models.ForeignKey(
        RoadmapWeek, on_delete=models.CASCADE, related_name="topics"
    )
    topic_slug = models.SlugField(max_length=200, db_index=True)
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField()
    estimated_minutes = models.PositiveIntegerField(default=30)
    depth_level = models.CharField(max_length=50, default="standard")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.order}. {self.title}"


class TopicProgress(models.Model):
    STATUS_NOT_STARTED = "not_started"
    STATUS_COMPLETED = "completed"
    STATUS_SKIPPED = "skipped"

    STATUS_CHOICES = [
        (STATUS_NOT_STARTED, "Not Started"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_SKIPPED, "Not Verified"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    roadmap = models.ForeignKey(
        Roadmap, on_delete=models.CASCADE, related_name="topic_progresses"
    )
    topic = models.ForeignKey(
        RoadmapTopicReference, on_delete=models.CASCADE, related_name="progress_records"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_NOT_STARTED
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("roadmap", "topic")
        ordering = ["topic__order"]

    def __str__(self):
        return f"{self.roadmap_id} - {self.topic.title}: {self.status}"
