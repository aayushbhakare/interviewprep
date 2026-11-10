import uuid
from django.db import models
from apps.common.models import TimeStampedModel


class TopicContent(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=200, db_index=True)
    topic_name = models.CharField(max_length=200)
    technology = models.CharField(max_length=100, db_index=True)
    version = models.PositiveIntegerField(default=1)
    learning_objectives = models.JSONField(default=list)
    concept_explanation = models.TextField()
    how_it_works = models.TextField(blank=True)
    examples = models.JSONField(default=list)
    practical_implementation = models.TextField(blank=True)
    interview_perspective = models.TextField(blank=True)
    key_takeaways = models.JSONField(default=list)
    is_published = models.BooleanField(default=True)

    class Meta:
        unique_together = ("slug", "version")
        ordering = ["technology", "topic_name", "-version"]

    def __str__(self):
        return f"{self.technology}: {self.topic_name} (v{self.version})"
