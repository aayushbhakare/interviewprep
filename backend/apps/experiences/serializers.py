from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from apps.experiences.models import (
    InterviewExperience,
    ExperienceStage,
    StageQuestion,
    ExperienceHelpfulVote,
    ExperienceReport,
)


class StageQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StageQuestion
        fields = [
            "id",
            "question_text",
            "follow_up_text",
            "interviewer_approach",
            "student_response",
            "difficulty",
            "order",
        ]


class ExperienceStageSerializer(serializers.ModelSerializer):
    questions = StageQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = ExperienceStage
        fields = [
            "id",
            "stage_type",
            "custom_stage_name",
            "order",
            "stage_date",
            "stage_time",
            "time_gap",
            "interview_mode",
            "difficulty",
            "result",
            "advanced",
            "description",
            "additional_notes",
            "questions",
        ]


class ExperienceListSerializer(serializers.ModelSerializer):
    author_display_name = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()
    stages_count = serializers.SerializerMethodField()

    class Meta:
        model = InterviewExperience
        fields = [
            "id",
            "company_name",
            "role",
            "experience_level",
            "salary_range",
            "company_location",
            "recruitment_year",
            "job_type",
            "interview_mode",
            "overall_difficulty",
            "overall_outcome",
            "is_anonymous",
            "author_display_name",
            "helpful_votes_count",
            "reports_count",
            "has_voted",
            "stages_count",
            "published_at",
            "created_at",
        ]

    @extend_schema_field(serializers.CharField)
    def get_author_display_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous Candidate"
        if obj.author:
            name = (
                getattr(obj.author, "full_name", None) or obj.author.email.split("@")[0]
            ).strip()
            return name if name else "Candidate"
        return "Candidate"

    @extend_schema_field(serializers.BooleanField)
    def get_has_voted(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return False
        # If preloaded attribute exists
        if hasattr(obj, "user_has_voted"):
            return bool(obj.user_has_voted)
        return ExperienceHelpfulVote.objects.filter(user=user, experience=obj).exists()

    @extend_schema_field(serializers.IntegerField)
    def get_stages_count(self, obj):
        return obj.stages.count()


class ExperienceDetailSerializer(serializers.ModelSerializer):
    author_display_name = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()
    stages = ExperienceStageSerializer(many=True, read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = InterviewExperience
        fields = [
            "id",
            "company_name",
            "role",
            "experience_level",
            "salary_range",
            "company_location",
            "recruitment_year",
            "job_type",
            "interview_mode",
            "overall_difficulty",
            "overall_outcome",
            "additional_context",
            "is_anonymous",
            "author_display_name",
            "status",
            "rejection_reason",
            "helpful_votes_count",
            "reports_count",
            "has_voted",
            "is_owner",
            "published_version",
            "published_at",
            "created_at",
            "stages",
        ]

    @extend_schema_field(serializers.CharField)
    def get_author_display_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous Candidate"
        if obj.author:
            name = (
                getattr(obj.author, "full_name", None) or obj.author.email.split("@")[0]
            ).strip()
            return name if name else "Candidate"
        return "Candidate"

    @extend_schema_field(serializers.BooleanField)
    def get_has_voted(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return False
        return ExperienceHelpfulVote.objects.filter(user=user, experience=obj).exists()

    @extend_schema_field(serializers.BooleanField)
    def get_is_owner(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return False
        return obj.author_id == user.id


class ExperienceDraftInputSerializer(serializers.Serializer):
    company_name = serializers.CharField(
        required=False, allow_blank=True, max_length=200
    )
    role = serializers.CharField(required=False, allow_blank=True, max_length=100)
    experience_level = serializers.CharField(
        required=False, allow_blank=True, max_length=50
    )
    salary_range = serializers.CharField(
        required=False, allow_blank=True, max_length=50
    )
    company_location = serializers.CharField(
        required=False, allow_blank=True, max_length=150
    )
    recruitment_year = serializers.IntegerField(required=False, allow_null=True)
    job_type = serializers.CharField(required=False, allow_blank=True, max_length=50)
    interview_mode = serializers.CharField(
        required=False, allow_blank=True, max_length=50
    )
    overall_difficulty = serializers.CharField(
        required=False, allow_blank=True, max_length=30
    )
    overall_outcome = serializers.CharField(
        required=False, allow_blank=True, max_length=30
    )
    additional_context = serializers.CharField(required=False, allow_blank=True)
    is_anonymous = serializers.BooleanField(required=False, default=False)
    stages = serializers.ListField(child=serializers.DictField(), required=False)


class ExperiencePublishInputSerializer(ExperienceDraftInputSerializer):
    pass


class ExperienceReportInputSerializer(serializers.Serializer):
    reason = serializers.ChoiceField(choices=ExperienceReport.REASON_CHOICES)
    explanation = serializers.CharField(required=False, allow_blank=True)


class ExperienceAdminReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=["approve", "reject", "suspend", "restore"]
    )
    reason = serializers.CharField(required=False, allow_blank=True)
    version_number = serializers.IntegerField(required=False, allow_null=True)


class ExperienceReportAdminResolveSerializer(serializers.Serializer):
    resolution = serializers.ChoiceField(
        choices=["dismiss", "resolve_suspend", "resolve_restore"]
    )
    admin_notes = serializers.CharField(required=False, allow_blank=True)
