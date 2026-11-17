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


class AdminAIModelsListView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="List AI Services and Provider Configurations",
        description="Inspect provider routing, active model identifiers, fallback providers, and operational statuses across all platform AI services.",
        responses={200: dict},
    )
    def get(self, request):
        config = get_setting("ai_models_config", {})
        services = []
        for service_key, data in config.items():
            services.append(
                {
                    "service_key": service_key,
                    "service_label": data.get("service_label", service_key),
                    "provider": data.get("provider", "deterministic"),
                    "model": data.get("model", ""),
                    "fallback_provider": data.get("fallback_provider", "none"),
                    "status": data.get("status", "active"),
                    "timeout_seconds": data.get("timeout_seconds", 30),
                }
            )

        return Response(
            {
                "status": "success",
                "data": {
                    "services": services,
                    "available_providers": [
                        {"id": "deterministic", "name": "Deterministic Engine (Offline Fallback, ₹0)"},
                        {"id": "gemini", "name": "Google Gemini 2.0 Flash"},
                    ],
                },
            }
        )


class AdminAIModelUpdateView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Update AI Service Provider/Model Assignment",
        description="Reconfigures the active provider or model identifier for an AI service with capability validation and audit logging.",
        request={"application/json": {"properties": {"provider": {"type": "string"}}}},
        responses={200: dict},
    )
    def put(self, request, service_key):
        config = get_setting("ai_models_config", {})
        if service_key not in config:
            return Response(
                {"detail": f"Unknown AI service '{service_key}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        provider = request.data.get("provider", "").strip().lower()
        model = request.data.get("model", "").strip()
        fallback = request.data.get("fallback_provider", "none").strip().lower()

        if provider not in ("deterministic", "gemini"):
            return Response(
                {"detail": "Provider must be either 'deterministic' or 'gemini'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Capability validation: Real-time voice simulation requires audio/dialogue compatibility
        if service_key == "voice_simulation" and provider == "gemini" and "embedding" in model.lower():
            return Response(
                {"detail": "Selected model does not support real-time audio dialogue."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_val = dict(config[service_key])

        config[service_key]["provider"] = provider
        if model:
            config[service_key]["model"] = model
        if fallback in ("deterministic", "gemini", "none"):
            config[service_key]["fallback_provider"] = fallback

        set_setting("ai_models_config", config, updated_by=request.user)

        log_admin_activity(
            actor=request.user,
            action="ai_service_provider_updated",
            resource_type="ai_service",
            resource_id=service_key,
            details={
                "service_key": service_key,
                "previous_config": prev_val,
                "new_config": config[service_key],
            },
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"AI service '{service_key}' configuration updated successfully.",
                "data": config[service_key],
            }
        )
