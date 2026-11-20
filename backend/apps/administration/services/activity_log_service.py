from apps.administration.models import AdminActivityLog


def log_admin_activity(
    actor,
    action: str,
    resource_type: str,
    resource_id: str = "",
    details: dict = None,
    request=None,
):
    ip_address = None
    if request:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(",")[0].strip()
        else:
            ip_address = request.META.get("REMOTE_ADDR")

    return AdminActivityLog.objects.create(
        actor=actor,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        details=details or {},
        ip_address=ip_address,
    )
