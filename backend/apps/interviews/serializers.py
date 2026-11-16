from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from apps.interviews.models import InterviewConfig, InterviewRound, InterviewSession


class InterviewEligibilityResponseSerializer(serializers.Serializer):
    technical = serializers.DictField()
    hr = serializers.DictField()
    mixed = serializers.DictField()
    active_session = serializers.DictField(allow_null=True)


class InterviewSetupPrepopulateResponseSerializer(serializers.Serializer):
    has_active_roadmap = serializers.BooleanField()
    role = serializers.CharField()
    experience_level = serializers.CharField()
    salary_range = serializers.CharField()
    language = serializers.CharField(allow_blank=True)
    framework = serializers.CharField(allow_blank=True)
    database = serializers.CharField(allow_blank=True)
    available_resumes = serializers.ListField()
    current_resume_version = serializers.IntegerField()


class InterviewSessionCreateSerializer(serializers.Serializer):
    interview_type = serializers.ChoiceField(
        choices=[
            InterviewSession.TYPE_TECHNICAL,
            InterviewSession.TYPE_HR,
            InterviewSession.TYPE_MIXED,
        ]
    )
    role = serializers.CharField(max_length=100)
    experience_level = serializers.CharField(max_length=50)
    salary_range = serializers.CharField(max_length=50)
    language = serializers.CharField(max_length=50, required=False, allow_blank=True)
    framework = serializers.CharField(max_length=50, required=False, allow_blank=True)
    database = serializers.CharField(max_length=50, required=False, allow_blank=True)
    resume_version_reference = serializers.IntegerField(required=False, allow_null=True)


class InterviewTurnInputSerializer(serializers.Serializer):
    speech_text = serializers.CharField(max_length=5000, required=True, allow_blank=False)


class InterviewTurnResponseSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    round_id = serializers.UUIDField(required=False)
    round_number = serializers.IntegerField(required=False)
    interviewer_speech = serializers.CharField()
    status = serializers.CharField()
    next_question_index = serializers.IntegerField()
    total_questions = serializers.IntegerField()
    is_completed = serializers.BooleanField()


class InterviewRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewRound
        fields = [
            "id",
            "round_number",
            "round_type",
            "round_name",
            "round_description",
            "status",
            "result",
            "aptitude_session",
            "feedback",
            "started_at",
            "completed_at",
        ]


class InterviewSessionDetailSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    interview_type = serializers.CharField()
    role = serializers.CharField()
    experience_level = serializers.CharField()
    salary_range = serializers.CharField()
    language = serializers.CharField(allow_blank=True)
    framework = serializers.CharField(allow_blank=True)
    database = serializers.CharField(allow_blank=True)
    status = serializers.CharField()
    final_result = serializers.CharField()
    evaluation_status = serializers.CharField()
    resume_version = serializers.IntegerField(allow_null=True)
    resume_name = serializers.CharField(allow_null=True)
    cooling_period_until = serializers.CharField(allow_null=True)
    started_at = serializers.CharField()
    completed_at = serializers.CharField(allow_null=True)
    current_question_index = serializers.IntegerField()
    total_questions = serializers.IntegerField()
    turns = serializers.ListField()
    rounds = serializers.ListField()
    current_round = serializers.DictField(allow_null=True)
    overall_feedback = serializers.DictField()


class InterviewHistoryItemSerializer(serializers.ModelSerializer):
    rounds_summary = serializers.SerializerMethodField()

    class Meta:
        model = InterviewSession
        fields = [
            "id",
            "interview_type",
            "role",
            "salary_range",
            "experience_level",
            "status",
            "final_result",
            "cooling_period_until",
            "started_at",
            "completed_at",
            "rounds_summary",
        ]

    @extend_schema_field(serializers.ListField(child=serializers.DictField(), allow_null=True))
    def get_rounds_summary(self, obj):
        if obj.interview_type != InterviewSession.TYPE_MIXED:
            return None
        return [
            {
                "round_number": r.round_number,
                "round_name": r.round_name,
                "status": r.status,
                "result": r.result,
            }
            for r in obj.rounds.all().order_by("round_number")
        ]


class AdminInterviewConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewConfig
        fields = [
            "id",
            "name",
            "technical_cooling_hours",
            "hr_cooling_hours",
            "mixed_cooling_hours",
            "mixed_aptitude_cutoff",
            "default_provider",
            "default_model",
            "is_active",
            "updated_at",
        ]
