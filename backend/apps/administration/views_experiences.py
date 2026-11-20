from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.experiences.models import (
    InterviewExperience,
    ExperienceReport,
)
from apps.experiences.serializers import (
    ExperienceDetailSerializer,
    ExperienceAdminReviewSerializer,
    ExperienceReportAdminResolveSerializer,
)
from apps.experiences.services.experience_service import ExperienceService
from apps.administration.models import AdminActivityLog


def _enforce_staff(user):
    if not user.is_authenticated or not user.is_staff:
        raise PermissionDenied("Administrator privileges required.")


class StandardPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = "page_size"
    max_page_size = 50


class AdminExperienceModerationQueueView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_experience_moderation_queue_list",
        summary="Admin - Experience Moderation Queue",
        description="Filter experience submissions for moderation by status, reports count, or keyword search.",
        parameters=[
            OpenApiParameter(
                "status",
                str,
                description="Filter by status (pending_review, published, rejected, all)",
            ),
            OpenApiParameter(
                "search", str, description="Search company, role, or candidate email"
            ),
            OpenApiParameter(
                "has_reports",
                bool,
                description="Filter submissions with active community reports",
            ),
        ],
        responses={200: dict},
    )
    def get(self, request):
        _enforce_staff(request.user)

        qs = (
            InterviewExperience.objects.select_related("author")
            .prefetch_related("stages", "versions")
            .order_by("-created_at")
        )

        status_param = request.query_params.get("status", "pending_review").strip()
        if status_param and status_param != "all":
            qs = qs.filter(status=status_param)

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(company_name__icontains=search)
                | Q(role__icontains=search)
                | Q(author__email__icontains=search)
            )

        has_reports = request.query_params.get("has_reports")
        if has_reports in ["true", "True", "1"]:
            qs = qs.filter(reports_count__gt=0)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)

        results = []
        for exp in page:
            latest_version = exp.versions.order_by("-version_number").first()
            results.append(
                {
                    "id": str(exp.id),
                    "company_name": exp.company_name,
                    "role": exp.role,
                    "experience_level": exp.experience_level,
                    "salary_range": exp.salary_range,
                    "overall_outcome": exp.overall_outcome,
                    "status": exp.status,
                    "rejection_reason": exp.rejection_reason,
                    "is_anonymous": exp.is_anonymous,
                    "author_id": str(exp.author_id),
                    "author_email": exp.author.email if exp.author else "Unknown",
                    "author_name": (
                        getattr(exp.author, "full_name", None) or exp.author.email
                    )
                    if exp.author
                    else "Candidate",
                    "stages_count": exp.stages.count(),
                    "reports_count": exp.reports_count,
                    "is_hidden": exp.is_hidden,
                    "hidden_reason": exp.hidden_reason,
                    "published_version": exp.published_version,
                    "published_at": exp.published_at,
                    "created_at": exp.created_at,
                    "latest_moderation_result": latest_version.moderation_result
                    if latest_version
                    else {},
                }
            )

        return paginator.get_paginated_response(results)


class AdminExperienceModerationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_experience_moderation_detail_retrieve",
        summary="Admin - Get Experience Moderation Detail",
        description="Returns complete experience structure, questions, stages, author identity, and version history.",
        responses={200: dict},
    )
    def get(self, request, experience_id):
        _enforce_staff(request.user)
        try:
            exp = (
                InterviewExperience.objects.select_related("author")
                .prefetch_related("stages__questions", "versions")
                .get(id=experience_id)
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Interview experience not found.")

        detail = ExperienceDetailSerializer(exp, context={"user": request.user}).data
        # Admin gets author real identity even if anonymous
        detail["author_real_email"] = exp.author.email if exp.author else None
        detail["author_real_name"] = (
            (getattr(exp.author, "full_name", None) or exp.author.email)
            if exp.author
            else None
        )

        versions_data = [
            {
                "id": str(v.id),
                "version_number": v.version_number,
                "is_published": v.is_published,
                "status": v.status,
                "moderation_result": v.moderation_result,
                "rejection_reason": v.rejection_reason,
                "created_at": v.created_at,
                "snapshot_data": v.snapshot_data,
            }
            for v in exp.versions.all().order_by("-version_number")
        ]
        detail["versions_history"] = versions_data

        return Response({"status": "success", "data": detail})


class AdminExperienceModerationActionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Admin - Moderation Decision",
        description="Approve, reject, suspend, or restore an interview experience.",
        request=ExperienceAdminReviewSerializer,
        responses={200: dict},
    )
    def post(self, request, experience_id):
        _enforce_staff(request.user)
        serializer = ExperienceAdminReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        reason = serializer.validated_data.get("reason", "")
        version_number = serializer.validated_data.get("version_number")

        if action == "approve":
            exp = ExperienceService.admin_approve_experience(
                request.user, experience_id, version_number=version_number
            )
            msg = "Interview experience approved and published successfully."
        elif action == "reject":
            if not reason:
                raise ValidationError("Rejection reason is required.")
            exp = ExperienceService.admin_reject_experience(
                request.user, experience_id, reason=reason
            )
            msg = "Interview experience rejected."
        elif action == "suspend":
            if not reason:
                raise ValidationError("Suspension reason is required.")
            exp = ExperienceService.admin_suspend_experience(
                request.user, experience_id, reason=reason
            )
            msg = "Interview experience suspended and hidden from public discovery."
        elif action == "restore":
            exp = ExperienceService.admin_restore_experience(
                request.user, experience_id
            )
            msg = "Interview experience restored to public discovery."
        else:
            raise ValidationError("Invalid action.")

        return Response(
            {
                "status": "success",
                "message": msg,
                "data": {
                    "id": str(exp.id),
                    "status": exp.status,
                    "is_hidden": exp.is_hidden,
                },
            }
        )


class AdminExperienceReportsListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Admin - List Experience Community Reports",
        description="List community reports filed against interview experiences.",
        parameters=[
            OpenApiParameter(
                "status",
                str,
                description="Filter report status (pending, reviewed, resolved, dismissed)",
            ),
        ],
        responses={200: dict},
    )
    def get(self, request):
        _enforce_staff(request.user)
        qs = ExperienceReport.objects.select_related("reporter", "experience").order_by(
            "-created_at"
        )

        status_param = request.query_params.get("status", "pending").strip()
        if status_param and status_param != "all":
            qs = qs.filter(status=status_param)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)

        results = [
            {
                "id": str(rep.id),
                "experience_id": str(rep.experience_id),
                "company_name": rep.experience.company_name,
                "role": rep.experience.role,
                "reporter_email": rep.reporter.email,
                "reason": rep.reason,
                "explanation": rep.explanation,
                "status": rep.status,
                "admin_notes": rep.admin_notes,
                "created_at": rep.created_at,
            }
            for rep in page
        ]
        return paginator.get_paginated_response(results)


class AdminExperienceReportResolveView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Admin - Resolve Experience Report",
        description="Resolve or dismiss a community report filed against an experience.",
        request=ExperienceReportAdminResolveSerializer,
        responses={200: dict},
    )
    def post(self, request, report_id):
        _enforce_staff(request.user)
        try:
            report = ExperienceReport.objects.select_related("experience").get(
                id=report_id
            )
        except (ExperienceReport.DoesNotExist, ValueError):
            raise NotFound("Experience report not found.")

        serializer = ExperienceReportAdminResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resolution = serializer.validated_data["resolution"]
        admin_notes = serializer.validated_data.get("admin_notes", "").strip()

        if resolution == "dismiss":
            report.status = ExperienceReport.STATUS_DISMISSED
            report.admin_notes = admin_notes
            report.save()
        elif resolution == "resolve_suspend":
            report.status = ExperienceReport.STATUS_RESOLVED
            report.admin_notes = admin_notes
            report.save()
            ExperienceService.admin_suspend_experience(
                request.user,
                str(report.experience_id),
                reason=admin_notes or "Suspended following community report.",
            )
        elif resolution == "resolve_restore":
            report.status = ExperienceReport.STATUS_RESOLVED
            report.admin_notes = admin_notes
            report.save()
            ExperienceService.admin_restore_experience(
                request.user, str(report.experience_id)
            )

        AdminActivityLog.objects.create(
            actor=request.user,
            action=f"report_{resolution}",
            resource_type="ExperienceReport",
            resource_id=str(report.id),
            details={"resolution": resolution, "admin_notes": admin_notes},
        )

        return Response(
            {
                "status": "success",
                "message": f"Report marked as {report.status}.",
                "data": {"id": str(report.id), "status": report.status},
            }
        )
