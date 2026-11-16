from rest_framework import serializers
from apps.learning.models import (
    Roadmap,
    RoadmapPhase,
    RoadmapWeek,
    RoadmapTopicReference,
    TopicProgress,
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


class RoadmapTopicSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = RoadmapTopicReference
        fields = ["id", "topic_slug", "title", "order", "estimated_minutes", "depth_level", "status"]

    def get_status(self, obj):
        progress_dict = self.context.get("progress_dict", {})
        return progress_dict.get(obj.id, TopicProgress.STATUS_NOT_STARTED)


class RoadmapWeekSerializer(serializers.ModelSerializer):
    topics = serializers.SerializerMethodField()
    total_topics = serializers.SerializerMethodField()
    completed_topics = serializers.SerializerMethodField()

    class Meta:
        model = RoadmapWeek
        fields = ["id", "week_number", "title", "goal", "total_topics", "completed_topics", "topics"]

    def get_topics(self, obj):
        topics = obj.topics.all()
        return RoadmapTopicSerializer(topics, many=True, context=self.context).data

    def get_total_topics(self, obj):
        return obj.topics.count()

    def get_completed_topics(self, obj):
        progress_dict = self.context.get("progress_dict", {})
        topic_ids = [t.id for t in obj.topics.all()]
        return sum(1 for tid in topic_ids if progress_dict.get(tid) == TopicProgress.STATUS_COMPLETED)


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
            "phases",
        ]

    def get_stats(self, obj):
        return get_active_roadmap_stats(obj)

    def get_phases(self, obj):
        # Pre-fetch topic progresses to optimize queries
        progress_records = obj.topic_progresses.values_list("topic_id", "status")
        progress_dict = {tid: status for tid, status in progress_records}
        context = {"progress_dict": progress_dict}

        phases = obj.phases.prefetch_related("weeks__topics").all()
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
