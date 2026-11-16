from rest_framework import serializers
from apps.questions.models import (
    Question,
    QuestionVersion,
    QuestionReport,
    QuestionValidationHistory,
)


class QuestionVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionVersion
        fields = [
            "id",
            "version_number",
            "prompt",
            "code_snippet",
            "expected_answer",
            "evaluation_rubric",
            "explanation",
            "starter_code",
            "test_cases",
            "validation_status",
            "change_reason",
            "created_at",
        ]


class QuestionReportCreateSerializer(serializers.Serializer):
    reason = serializers.ChoiceField(choices=QuestionReport.REASON_CHOICES)
    description = serializers.CharField(min_length=5)


class QuestionReportSerializer(serializers.ModelSerializer):
    student_email = serializers.EmailField(source="student.email", read_only=True)

    class Meta:
        model = QuestionReport
        fields = [
            "id",
            "question_id",
            "student_id",
            "student_email",
            "reason",
            "description",
            "status",
            "admin_notes",
            "created_at",
        ]


class QuestionValidationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionValidationHistory
        fields = [
            "id",
            "attempt_number",
            "is_valid",
            "failure_reason",
            "validation_details",
            "created_at",
        ]


class QuestionDetailSerializer(serializers.ModelSerializer):
    versions = QuestionVersionSerializer(many=True, read_only=True)
    latest_version = QuestionVersionSerializer(read_only=True)
    reports = QuestionReportSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "technology",
            "topic_slug",
            "category",
            "difficulty",
            "status",
            "current_version_number",
            "times_assigned",
            "times_attempted",
            "correct_count",
            "created_at",
            "updated_at",
            "latest_version",
            "versions",
            "reports",
        ]


class AdminCreateQuestionSerializer(serializers.Serializer):
    technology = serializers.CharField(max_length=100)
    topic_slug = serializers.CharField(max_length=200)
    category = serializers.ChoiceField(choices=Question.CATEGORY_CHOICES)
    difficulty = serializers.ChoiceField(
        choices=Question.DIFFICULTY_CHOICES, default=Question.DIFFICULTY_MEDIUM
    )
    prompt = serializers.CharField(min_length=15)
    code_snippet = serializers.CharField(required=False, allow_blank=True, default="")
    expected_answer = serializers.CharField(min_length=3)
    evaluation_rubric = serializers.JSONField(required=False, default=dict)
    explanation = serializers.CharField(min_length=10)
    starter_code = serializers.CharField(required=False, allow_blank=True, default="")
    test_cases = serializers.ListField(required=False, default=list)


class AdminCreateVersionSerializer(serializers.Serializer):
    prompt = serializers.CharField(min_length=15)
    code_snippet = serializers.CharField(required=False, allow_blank=True, default="")
    expected_answer = serializers.CharField(min_length=3)
    evaluation_rubric = serializers.JSONField(required=False, default=dict)
    explanation = serializers.CharField(min_length=10)
    starter_code = serializers.CharField(required=False, allow_blank=True, default="")
    test_cases = serializers.ListField(required=False, default=list)
    change_reason = serializers.CharField(
        required=False, allow_blank=True, default="Admin updated content"
    )


class AdminUpdateQuestionStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Question.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
