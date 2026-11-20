from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema

from apps.administration.permissions import IsPlatformAdmin
from apps.administration.models import AdminActivityLog


class LogPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminActivityLogListView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="List Immutable Admin Activity Logs",
        description="Search, filter, and audit administrative actions across the platform with pagination.",
        responses={200: dict},
    )
    def get(self, request):
        qs = AdminActivityLog.objects.select_related("actor").order_by("-created_at")

        action = request.query_params.get("action", "").strip()
        if action:
            qs = qs.filter(action__iexact=action)

        resource_type = request.query_params.get("resource_type", "").strip()
        if resource_type:
            qs = qs.filter(resource_type__iexact=resource_type)

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(actor__email__icontains=search)
                | Q(actor__full_name__icontains=search)
                | Q(resource_id__icontains=search)
                | Q(action__icontains=search)
            )

        date_from = request.query_params.get("date_from", "").strip()
        if date_from:
            qs = qs.filter(created_at__gte=date_from)

        date_to = request.query_params.get("date_to", "").strip()
        if date_to:
            qs = qs.filter(created_at__lte=date_to)

        paginator = LogPagination()
        page = paginator.paginate_queryset(qs, request)

        results = []
        for log in page:
            results.append(
                {
                    "id": str(log.id),
                    "actor_email": log.actor.email if log.actor else "System",
                    "actor_name": log.actor.full_name if log.actor else "System",
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "details": log.details or {},
                    "ip_address": log.ip_address,
                    "created_at": log.created_at,
                }
            )

        return paginator.get_paginated_response(results)
