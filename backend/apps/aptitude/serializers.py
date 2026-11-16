from rest_framework import serializers
from apps.aptitude.models import (
    AptitudeQuestion,
    AptitudeQuestionVersion,
    AptitudeQuestionReport,
    AptitudeTestConfig,
    AptitudeSession,
)


class AptitudeQuestionVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AptitudeQuestionVersion
        fields = [
            "id",
            "version_number",
            "question_text",
            "options",
            "correct_option_index",
            "explanation",
            "validation_status",
            "is_published",
            "created_at",
        ]


class AptitudeQuestionSerializer(serializers.ModelSerializer):
    latest_version = serializers.SerializerMethodField()

    class Meta:
        model = AptitudeQuestion
        fields = [
            "id",
            "category",
            "topic",
            "difficulty",
            "status",
            "question_text",
            "options",
            "correct_option_index",
            "explanation",
            "is_active",
            "times_assigned",
            "times_attempted",
            "correct_count",
            "latest_version",
            "created_at",
            "updated_at",
        ]

    def get_latest_version(self, obj):
        v = obj.versions.order_by("-version_number").first()
        return v.version_number if v else 1


class AptitudeQuestionReportSerializer(serializers.ModelSerializer):
    question_summary = serializers.SerializerMethodField()
    reported_by_email = serializers.ReadOnlyField(source="reported_by.email")

    class Meta:
        model = AptitudeQuestionReport
        fields = [
            "id",
            "question",
            "question_summary",
            "reported_by_email",
            "reason",
            "description",
            "status",
            "admin_notes",
            "created_at",
            "updated_at",
        ]

    def get_question_summary(self, obj):
        return {
            "id": str(obj.question.id),
            "category": obj.question.category,
            "topic": obj.question.topic,
            "difficulty": obj.question.difficulty,
            "question_text": obj.question.question_text[:80],
        }


class AptitudeTestConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AptitudeTestConfig
        fields = [
            "id",
            "name",
            "total_questions",
            "duration_minutes",
            "distribution",
            "daily_limit",
            "mixed_qualifying_cutoff",
            "is_active",
            "created_at",
            "updated_at",
        ]


class AptitudeSessionSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = AptitudeSession
        fields = [
            "id",
            "session_type",
            "status",
            "score",
            "percentage",
            "total_marks",
            "correct_count",
            "incorrect_count",
            "total_questions",
            "time_spent_seconds",
            "started_at",
            "submitted_at",
            "created_at",
        ]
