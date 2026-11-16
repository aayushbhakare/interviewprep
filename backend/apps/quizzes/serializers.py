from rest_framework import serializers
from apps.quizzes.models import QuizAttempt


class QuizQuestionItemSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    submitted_answer = serializers.CharField(
        required=False, allow_blank=True, default=""
    )
    approach_explanation = serializers.CharField(
        required=False, allow_blank=True, default=""
    )


class QuizAutosaveSerializer(serializers.Serializer):
    answers = serializers.ListField(
        child=QuizQuestionItemSerializer(),
        allow_empty=True,
    )


class QuizQuestionReviewSerializer(serializers.Serializer):
    answer_id = serializers.UUIDField()
    question_id = serializers.UUIDField()
    order = serializers.IntegerField()
    category = serializers.CharField()
    difficulty = serializers.CharField()
    technology = serializers.CharField()
    prompt = serializers.CharField()
    code_snippet = serializers.CharField(allow_blank=True)
    starter_code = serializers.CharField(allow_blank=True)
    submitted_answer = serializers.CharField(allow_blank=True)
    approach_explanation = serializers.CharField(allow_blank=True)
    is_answered = serializers.BooleanField()
    expected_answer = serializers.CharField(allow_blank=True)
    explanation = serializers.CharField(allow_blank=True)
    is_correct = serializers.BooleanField(allow_null=True)
    evaluation_explanation = serializers.CharField(allow_blank=True)


class QuizAttemptResultSerializer(serializers.Serializer):
    attempt_id = serializers.UUIDField()
    assignment_id = serializers.UUIDField()
    week_number = serializers.IntegerField()
    attempt_number = serializers.IntegerField()
    status = serializers.CharField()
    started_at = serializers.DateTimeField()
    submitted_at = serializers.DateTimeField(allow_null=True)
    time_taken_seconds = serializers.IntegerField()
    total_questions = serializers.IntegerField()
    answered_count = serializers.IntegerField()
    score = serializers.FloatField(allow_null=True)
    correct_count = serializers.IntegerField()
    incorrect_count = serializers.IntegerField()
    questions = serializers.ListField(child=QuizQuestionReviewSerializer())


class QuizAttemptHistoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = [
            "id",
            "attempt_number",
            "status",
            "started_at",
            "submitted_at",
            "time_taken_seconds",
            "score",
            "correct_count",
            "incorrect_count",
            "total_questions",
        ]
