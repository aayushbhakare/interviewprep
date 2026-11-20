from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.administration.permissions import IsPlatformAdmin
from apps.administration.models import PlatformSetting
from apps.administration.services.platform_settings_service import (
    get_all_settings,
    set_setting,
)
from apps.administration.services.activity_log_service import log_admin_activity


class AdminPlatformSettingsListView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="List All Platform Settings",
        description="Retrieves centralized platform configuration across Aptitude, Quizzes, Interviews, Accounts, and Maintenance.",
        responses={200: dict},
    )
    def get(self, request):
        settings_dict = get_all_settings()
        return Response(
            {
                "status": "success",
                "data": settings_dict,
            }
        )


class AdminPlatformSettingUpdateView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Update Platform Setting",
        description="Updates an operational configuration setting with strict validation and audit logging.",
        request={"application/json": {"properties": {"value": {"type": "object"}}}},
        responses={200: dict},
    )
    def put(self, request, key):
        new_value = request.data.get("value")
        if new_value is None:
            return Response(
                {"detail": "value field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Domain Validation Rules
        if key == "aptitude_config":
            total_q = new_value.get("total_questions", 45)
            cats = new_value.get("categories", {})
            if sum(cats.values()) != total_q:
                return Response(
                    {
                        "detail": f"Category question counts ({sum(cats.values())}) must equal total questions ({total_q})."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            cutoff = float(new_value.get("mixed_cutoff_percentage", 60.0))
            if not (0 <= cutoff <= 100):
                return Response(
                    {"detail": "Mixed cutoff percentage must be between 0 and 100."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        elif key == "quiz_config":
            total_q = new_value.get("question_count", 45)
            if total_q != 45:
                return Response(
                    {"detail": "Weekly technical quiz specification requires exactly 45 questions."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            attempts = new_value.get("max_attempts_per_quiz", 5)
            if attempts <= 0:
                return Response(
                    {"detail": "Maximum attempts must be greater than 0."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        elif key == "interview_config":
            for field in [
                "cooling_hours_technical",
                "cooling_hours_hr",
                "cooling_hours_mixed",
            ]:
                if float(new_value.get(field, 24)) < 0:
                    return Response(
                        {"detail": f"{field} cannot be negative."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # Retrieve previous value for audit logging
        prev_setting = PlatformSetting.objects.filter(key=key).first()
        prev_val = prev_setting.value if prev_setting else None

        updated_setting = set_setting(
            key=key,
            value=new_value,
            description=request.data.get("description", ""),
            updated_by=request.user,
        )

        log_admin_activity(
            actor=request.user,
            action="platform_setting_updated",
            resource_type="platform_setting",
            resource_id=key,
            details={
                "setting_key": key,
                "previous_value": prev_val,
                "new_value": new_value,
            },
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"Platform setting '{key}' updated successfully.",
                "data": {
                    "key": updated_setting.key,
                    "value": updated_setting.value,
                    "updated_at": updated_setting.updated_at,
                },
            }
        )
