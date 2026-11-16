from rest_framework import serializers
from apps.learning.models import (
    Roadmap,
    RoadmapPhase,
    RoadmapWeek,
    RoadmapTopicReference,
    RoadmapPracticeTask,
    TopicProgress,
    PracticeTaskProgress,
)
from apps.content.models import TopicContent
from apps.learning.services.progress_service import get_active_roadmap_stats


class RoadmapCreateSerializer(serializers.Serializer):
    role = serializers.CharField(max_length=100)
    custom_role = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    experience_level = serializers.CharField(max_length=50)
    target_salary = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    language = serializers.CharField(max_length=50)
    framework = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    database = serializers.CharField(max_length=50)
    replace = serializers.BooleanField(default=False)


class TopicProgressUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            TopicProgress.STATUS_NOT_STARTED,
            TopicProgress.STATUS_COMPLETED,
            TopicProgress.STATUS_SKIPPED,
        ]
    )


class PracticeTaskProgressUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            PracticeTaskProgress.STATUS_NOT_STARTED,
            PracticeTaskProgress.STATUS_IN_PROGRESS,
            PracticeTaskProgress.STATUS_COMPLETED,
        ]
    )
    submission_notes = serializers.CharField(required=False, allow_blank=True, default="")


class RoadmapPracticeTaskSummarySerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    related_topic_id = serializers.UUIDField(source="related_topic.id", read_only=True, allow_null=True)
    related_topic_title = serializers.CharField(source="related_topic.title", read_only=True, allow_null=True)

    class Meta:
        model = RoadmapPracticeTask
        fields = [
            "id",
            "title",
            "task_type",
            "difficulty",
            "estimated_minutes",
            "order",
            "objective",
            "status",
            "related_topic_id",
            "related_topic_title",
        ]

    def get_status(self, obj):
        practice_dict = self.context.get("practice_progress_dict", {})
        return practice_dict.get(obj.id, PracticeTaskProgress.STATUS_NOT_STARTED)


class PracticeTaskDetailSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    submission_notes = serializers.SerializerMethodField()
    completed_at = serializers.SerializerMethodField()
    related_topic = serializers.SerializerMethodField()

    class Meta:
        model = RoadmapPracticeTask
        fields = [
            "id",
            "week_id",
            "title",
            "task_type",
            "difficulty",
            "estimated_minutes",
            "order",
            "objective",
            "problem_statement",
            "requirements",
            "constraints",
            "sample_io",
            "expected_deliverable",
            "starter_code",
            "hints",
            "status",
            "submission_notes",
            "completed_at",
            "related_topic",
            "created_at",
        ]

    def get_status(self, obj):
        record = obj.progress_records.filter(roadmap__user=self.context.get("user")).first()
        return record.status if record else PracticeTaskProgress.STATUS_NOT_STARTED

    def get_submission_notes(self, obj):
        record = obj.progress_records.filter(roadmap__user=self.context.get("user")).first()
        return record.submission_notes if record else ""

    def get_completed_at(self, obj):
        record = obj.progress_records.filter(roadmap__user=self.context.get("user")).first()
        return record.completed_at.isoformat() if record and record.completed_at else None

    def get_related_topic(self, obj):
        if not obj.related_topic:
            return None
        return {
            "id": str(obj.related_topic.id),
            "title": obj.related_topic.title,
            "topic_slug": obj.related_topic.topic_slug,
        }


class RoadmapTopicSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    related_practice_task_ids = serializers.SerializerMethodField()

    class Meta:
        model = RoadmapTopicReference
        fields = [
            "id",
            "topic_slug",
            "title",
            "order",
            "estimated_minutes",
            "depth_level",
            "status",
            "related_practice_task_ids",
        ]

    def get_status(self, obj):
        progress_dict = self.context.get("progress_dict", {})
        return progress_dict.get(obj.id, TopicProgress.STATUS_NOT_STARTED)

    def get_related_practice_task_ids(self, obj):
        # List of task IDs associated with this topic
        return [str(t.id) for t in obj.practice_tasks.all()]


class RoadmapWeekSerializer(serializers.ModelSerializer):
    topics = serializers.SerializerMethodField()
    practice_tasks = serializers.SerializerMethodField()
    total_topics = serializers.SerializerMethodField()
    completed_topics = serializers.SerializerMethodField()
    total_tasks = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()

    class Meta:
        model = RoadmapWeek
        fields = [
            "id",
            "week_number",
            "title",
            "goal",
            "total_topics",
            "completed_topics",
            "total_tasks",
            "completed_tasks",
            "topics",
            "practice_tasks",
        ]

    def get_topics(self, obj):
        topics = obj.topics.all()
        return RoadmapTopicSerializer(topics, many=True, context=self.context).data

    def get_practice_tasks(self, obj):
        tasks = obj.practice_tasks.all()
        return RoadmapPracticeTaskSummarySerializer(tasks, many=True, context=self.context).data

    def get_total_topics(self, obj):
        return obj.topics.count()

    def get_completed_topics(self, obj):
        progress_dict = self.context.get("progress_dict", {})
        topic_ids = [t.id for t in obj.topics.all()]
        return sum(1 for tid in topic_ids if progress_dict.get(tid) == TopicProgress.STATUS_COMPLETED)

    def get_total_tasks(self, obj):
        return obj.practice_tasks.count()

    def get_completed_tasks(self, obj):
        practice_dict = self.context.get("practice_progress_dict", {})
        task_ids = [t.id for t in obj.practice_tasks.all()]
        return sum(1 for tid in task_ids if practice_dict.get(tid) == PracticeTaskProgress.STATUS_COMPLETED)


class RoadmapPhaseSerializer(serializers.ModelSerializer):
    weeks = serializers.SerializerMethodField()

    class Meta:
        model = RoadmapPhase
        fields = ["id", "phase_number", "title", "description", "weeks"]

    def get_weeks(self, obj):
        weeks = obj.weeks.all()
        return RoadmapWeekSerializer(weeks, many=True, context=self.context).data


class RoadmapDetailSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()
    learning_stats = serializers.SerializerMethodField()
    practice_stats = serializers.SerializerMethodField()
    phases = serializers.SerializerMethodField()

    class Meta:
        model = Roadmap
        fields = [
            "id",
            "role",
            "experience_level",
            "target_salary",
            "language",
            "framework",
            "database",
            "status",
            "is_active",
            "created_at",
            "stats",
            "learning_stats",
            "practice_stats",
            "phases",
        ]

    def get_stats(self, obj):
        return get_active_roadmap_stats(obj)

    def get_learning_stats(self, obj):
        return get_active_roadmap_stats(obj).get("learning_stats", {})

    def get_practice_stats(self, obj):
        return get_active_roadmap_stats(obj).get("practice_stats", {})

    def get_phases(self, obj):
        # Pre-fetch progress states to prevent N+1 queries
        topic_progresses = obj.topic_progresses.values_list("topic_id", "status")
        progress_dict = {tid: status for tid, status in topic_progresses}

        practice_progresses = obj.practice_progresses.values_list("task_id", "status")
        practice_progress_dict = {tid: status for tid, status in practice_progresses}

        context = {
            "progress_dict": progress_dict,
            "practice_progress_dict": practice_progress_dict,
        }

        phases = obj.phases.prefetch_related(
            "weeks__topics__practice_tasks",
            "weeks__practice_tasks__related_topic",
        ).all()
        return RoadmapPhaseSerializer(phases, many=True, context=context).data


class TopicContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicContent
        fields = [
            "id",
            "slug",
            "topic_name",
            "technology",
            "version",
            "learning_objectives",
            "concept_explanation",
            "how_it_works",
            "examples",
            "practical_implementation",
            "interview_perspective",
            "key_takeaways",
        ]
