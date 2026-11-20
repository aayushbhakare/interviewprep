from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.administration.permissions import IsPlatformAdmin
from apps.administration.services.platform_settings_service import (
    get_setting,
    set_setting,
)
from apps.administration.services.activity_log_service import log_admin_activity


class AdminMaintenanceView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Get Platform Maintenance Configuration",
        description="Inspect global and module-level maintenance toggles and student messaging.",
        responses={200: dict},
    )
    def get(self, request):
        cfg = get_setting("maintenance_config", {})
        return Response(
            {
                "status": "success",
                "data": cfg,
            }
        )

    @extend_schema(
        summary="Update Platform Maintenance Mode",
        description="Toggle global platform maintenance or individual module restrictions with audit logging.",
        request={"application/json": {"properties": {"global_maintenance": {"type": "boolean"}}}},
        responses={200: dict},
    )
    def post(self, request):
        cfg = get_setting("maintenance_config", {})
        prev_cfg = dict(cfg)

        if "global_maintenance" in request.data:
            cfg["global_maintenance"] = bool(request.data["global_maintenance"])
        if "global_message" in request.data:
            cfg["global_message"] = request.data["global_message"].strip()

        if "modules" in request.data and isinstance(request.data["modules"], dict):
            existing_modules = cfg.get("modules", {})
            for mod_key, mod_val in request.data["modules"].items():
                if mod_key in existing_modules:
                    if "enabled" in mod_val:
                        existing_modules[mod_key]["enabled"] = bool(mod_val["enabled"])
                    if "message" in mod_val:
                        existing_modules[mod_key]["message"] = mod_val["message"].strip()
            cfg["modules"] = existing_modules

        set_setting("maintenance_config", cfg, updated_by=request.user)

        log_admin_activity(
            actor=request.user,
            action="maintenance_mode_updated",
            resource_type="maintenance_config",
            resource_id="global",
            details={
                "previous_maintenance": prev_cfg,
                "new_maintenance": cfg,
            },
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": "Maintenance settings updated successfully.",
                "data": cfg,
            },
            status=status.HTTP_200_OK,
        )
