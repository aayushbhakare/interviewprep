import re
from django.http import JsonResponse
from apps.administration.services.platform_settings_service import get_setting

# Endpoints that initiate a new session/submission for specific modules
MODULE_CREATION_PATTERNS = {
    "quizzes": [
        re.compile(r"^/api/v1/quizzes/weeks/\d+/start/?$"),
    ],
    "aptitude": [
        re.compile(r"^/api/v1/aptitude/sessions/start/?$"),
    ],
    "interviews_technical": [
        re.compile(r"^/api/v1/interviews/sessions/setup/?$"),
    ],
    "interviews_hr": [
        re.compile(r"^/api/v1/interviews/sessions/setup/?$"),
    ],
    "interviews_mixed": [
        re.compile(r"^/api/v1/interviews/sessions/setup/?$"),
    ],
    "learning": [
        re.compile(r"^/api/v1/learning/roadmaps/?$"),
    ],
    "experiences": [
        re.compile(r"^/api/v1/experiences/drafts/?$"),
        re.compile(r"^/api/v1/experiences/[0-9a-f-]+/publish/?$"),
    ],
}

EXCLUDED_PREFIXES = (
    "/api/v1/admin-panel/",
    "/admin/",
    "/api/v1/auth/",
    "/api/v1/health/",
    "/api/v1/docs/",
    "/api/v1/schema/",
)


def _get_request_user(request):
    user = getattr(request, "_force_auth_user", None) or getattr(request, "user", None)
    if not user or not user.is_authenticated:
        from rest_framework_simplejwt.authentication import JWTAuthentication
        try:
            auth_res = JWTAuthentication().authenticate(request)
            if auth_res:
                user = auth_res[0]
                request.user = user
        except Exception:
            pass
    return user


class MaintenanceModeMiddleware:
    """
    Enforces global and per-module maintenance modes on student requests.
    Exempts staff administrators and in-flight active sessions.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Always permit administration, authentication, health checks, and API docs
        if any(path.startswith(prefix) for prefix in EXCLUDED_PREFIXES):
            return self.get_response(request)

        # Staff administrators are always permitted through to manage the platform
        user = _get_request_user(request)
        if user and user.is_authenticated and user.is_staff:
            return self.get_response(request)

        maintenance_cfg = get_setting("maintenance_config", {})
        if not maintenance_cfg:
            return self.get_response(request)

        # 1. Global Maintenance Check
        if maintenance_cfg.get("global_maintenance", False):
            return JsonResponse(
                {
                    "status": "error",
                    "code": "global_maintenance",
                    "message": maintenance_cfg.get(
                        "global_message",
                        "The platform is currently undergoing scheduled maintenance. Please check back shortly.",
                    ),
                    "module": "global",
                },
                status=503,
            )

        # 2. Module-Level Maintenance Check (Non-destructive to active sessions)
        modules = maintenance_cfg.get("modules", {})
        for module_name, patterns in MODULE_CREATION_PATTERNS.items():
            mod_data = modules.get(module_name, {})
            if mod_data.get("enabled", False):
                for pattern in patterns:
                    if pattern.match(path):
                        return JsonResponse(
                            {
                                "status": "error",
                                "code": "module_maintenance",
                                "message": mod_data.get(
                                    "message",
                                    f"The {module_name} module is temporarily unavailable due to scheduled maintenance.",
                                ),
                                "module": module_name,
                            },
                            status=503,
                        )

        return self.get_response(request)


class AccountSuspensionMiddleware:
    """
    Blocks suspended student users from accessing protected APIs.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = _get_request_user(request)
        if (
            user
            and user.is_authenticated
            and not user.is_staff
            and getattr(user, "is_suspended", False)
        ):
            # Allow logout and viewing profile status
            if request.path in ("/api/v1/auth/logout/", "/api/v1/account/profile/"):
                return self.get_response(request)

            reason = getattr(user, "suspension_reason", "") or "Policy violation"
            return JsonResponse(
                {
                    "status": "error",
                    "code": "account_suspended",
                    "message": f"Your account has been suspended by administration. Reason: {reason}",
                },
                status=403,
            )

        return self.get_response(request)
