from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.experiences.models import (
    InterviewExperience,
)
from apps.experiences.serializers import (
    ExperienceListSerializer,
    ExperienceDetailSerializer,
    ExperienceDraftInputSerializer,
    ExperiencePublishInputSerializer,
    ExperienceReportInputSerializer,
)
from apps.experiences.services.experience_service import ExperienceService


class StandardPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50


class ExperiencePublicListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="List Published Interview Experiences",
        description="Public feed of peer recruitment experiences with keyword search and multi-faceted filtering.",
        parameters=[
            OpenApiParameter("search", str, description="Search company name or role"),
            OpenApiParameter("role", str, description="Filter by role"),
            OpenApiParameter("company", str, description="Filter by company name"),
            OpenApiParameter("salary_range", str, description="Filter by salary range"),
            OpenApiParameter(
                "experience_level", str, description="Filter by experience level"
            ),
            OpenApiParameter(
                "outcome",
                str,
                description="Filter by outcome (selected, rejected, etc.)",
            ),
            OpenApiParameter(
                "mode",
                str,
                description="Filter by interview mode (Online, Offline, Hybrid)",
            ),
            OpenApiParameter("difficulty", str, description="Filter by difficulty"),
            OpenApiParameter("year", int, description="Filter by recruitment year"),
            OpenApiParameter(
                "ordering", str, description="Sort order: 'recent' or 'helpful'"
            ),
        ],
        responses={200: ExperienceListSerializer(many=True)},
    )
    def get(self, request):
        queryset = (
            InterviewExperience.objects.filter(
                status=InterviewExperience.STATUS_PUBLISHED,
                is_hidden=False,
            )
            .select_related("author")
            .prefetch_related("stages")
        )

        # 1. Search Query
        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search)
                | Q(role__icontains=search)
                | Q(additional_context__icontains=search)
            )

        # 2. Filters
        role = request.query_params.get("role", "").strip()
        if role:
            queryset = queryset.filter(role__iexact=role)

        company = request.query_params.get("company", "").strip()
        if company:
            queryset = queryset.filter(company_name__icontains=company)

        salary_range = request.query_params.get("salary_range", "").strip()
        if salary_range:
            queryset = queryset.filter(salary_range=salary_range)

        experience_level = request.query_params.get("experience_level", "").strip()
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)

        outcome = request.query_params.get("outcome", "").strip()
        if outcome:
            queryset = queryset.filter(overall_outcome=outcome)

        mode = request.query_params.get("mode", "").strip()
        if mode:
            queryset = queryset.filter(interview_mode__iexact=mode)

        difficulty = request.query_params.get("difficulty", "").strip()
        if difficulty:
            queryset = queryset.filter(overall_difficulty__iexact=difficulty)

        year = request.query_params.get("year")
        if year:
            try:
                queryset = queryset.filter(recruitment_year=int(year))
            except ValueError:
                pass

        # 3. Ordering
        ordering = request.query_params.get("ordering", "recent")
        if ordering == "helpful":
            queryset = queryset.order_by("-helpful_votes_count", "-published_at")
        else:
            queryset = queryset.order_by("-published_at", "-created_at")

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ExperienceListSerializer(
            page, many=True, context={"user": request.user}
        )
        return paginator.get_paginated_response(serializer.data)


class ExperiencePublicDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Get Interview Experience Detail",
        description="Retrieve full journey breakdown including stages, questions, approach, and responses.",
        responses={200: ExperienceDetailSerializer},
    )
    def get(self, request, experience_id):
        try:
            experience = (
                InterviewExperience.objects.select_related("author")
                .prefetch_related("stages__questions")
                .get(id=experience_id)
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Interview experience not found.")

        # Check visibility
        is_owner = (
            request.user.is_authenticated and experience.author_id == request.user.id
        )
        is_staff = request.user.is_authenticated and request.user.is_staff

        if experience.is_hidden and not (is_owner or is_staff):
            raise NotFound("Interview experience is unavailable.")

        if experience.status != InterviewExperience.STATUS_PUBLISHED and not (
            is_owner or is_staff
        ):
            raise NotFound("Interview experience not found.")

        serializer = ExperienceDetailSerializer(
            experience, context={"user": request.user}
        )
        return Response({"status": "success", "data": serializer.data})


class MyExperiencesListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List Candidate's Own Experiences",
        description="Returns all drafts, pending reviews, published, and rejected submissions for the authenticated student.",
        responses={200: ExperienceDetailSerializer(many=True)},
    )
    def get(self, request):
        status_filter = request.query_params.get("status", "").strip()
        queryset = (
            InterviewExperience.objects.filter(author=request.user)
            .prefetch_related("stages__questions")
            .order_by("-created_at")
        )

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        serializer = ExperienceDetailSerializer(
            queryset, many=True, context={"user": request.user}
        )
        return Response({"status": "success", "data": serializer.data})


class ExperienceDraftCreateView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExperienceDraftInputSerializer

    @extend_schema(
        operation_id="experiences_draft_create",
        summary="Create Draft Experience",
        description="Saves a new private draft. Drafts are not moderated and not visible publicly.",
        request=ExperienceDraftInputSerializer,
        responses={201: ExperienceDetailSerializer},
    )
    def post(self, request):
        serializer = ExperienceDraftInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        exp = ExperienceService.save_draft(
            user=request.user,
            data=serializer.validated_data,
            experience_id=None,
        )
        detail_serializer = ExperienceDetailSerializer(
            exp, context={"user": request.user}
        )
        return Response(
            {
                "status": "success",
                "message": "Draft saved successfully.",
                "data": detail_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class ExperienceDraftUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExperienceDraftInputSerializer

    @extend_schema(
        operation_id="experiences_draft_update_post",
        summary="Save or Update Existing Draft Experience",
        description="Updates an existing private draft.",
        request=ExperienceDraftInputSerializer,
        responses={200: ExperienceDetailSerializer},
    )
    def post(self, request, experience_id):
        return self._save(request, experience_id)

    @extend_schema(
        operation_id="experiences_draft_update_put",
        summary="Update Existing Draft Experience",
        description="Updates an existing draft before submission.",
        request=ExperienceDraftInputSerializer,
        responses={200: ExperienceDetailSerializer},
    )
    def put(self, request, experience_id):
        return self._save(request, experience_id)

    def _save(self, request, experience_id):
        serializer = ExperienceDraftInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        exp = ExperienceService.save_draft(
            user=request.user,
            data=serializer.validated_data,
            experience_id=experience_id,
        )
        detail_serializer = ExperienceDetailSerializer(
            exp, context={"user": request.user}
        )
        return Response(
            {
                "status": "success",
                "message": "Draft saved successfully.",
                "data": detail_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


ExperienceDraftSaveView = ExperienceDraftCreateView


class ExperiencePublishView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Publish Interview Experience",
        description="Submits an experience for publication. Runs risk-based moderation for auto-publish or administrative review.",
        request=ExperiencePublishInputSerializer,
        responses={200: dict},
    )
    def post(self, request, experience_id):
        payload = None
        if request.data:
            serializer = ExperiencePublishInputSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            payload = serializer.validated_data

        result = ExperienceService.publish_experience(
            user=request.user,
            experience_id=experience_id,
            data=payload,
        )
        return Response({"status": "success", "data": result})


class ExperienceEditPublishedView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Edit Published Experience",
        description="Submits an update to a published experience. Previous version stays live while new version is moderated.",
        request=ExperiencePublishInputSerializer,
        responses={200: dict},
    )
    def put(self, request, experience_id):
        serializer = ExperiencePublishInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = ExperienceService.edit_published_experience(
            user=request.user,
            experience_id=experience_id,
            data=serializer.validated_data,
        )
        return Response({"status": "success", "data": result})


class ExperienceDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Delete Interview Experience",
        description="Deletes candidate's own experience and deactivates any extracted questions.",
        responses={200: dict},
    )
    def delete(self, request, experience_id):
        ExperienceService.delete_experience(
            user=request.user, experience_id=experience_id
        )
        return Response(
            {
                "status": "success",
                "message": "Interview experience deleted successfully.",
            }
        )


class ExperienceHelpfulVoteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Toggle Helpful Vote",
        description="Toggles helpful mark for a published experience.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, experience_id):
        result = ExperienceService.toggle_helpful_vote(
            user=request.user, experience_id=experience_id
        )
        return Response({"status": "success", "data": result})


class ExperienceReportView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Report Interview Experience",
        description="Flags an experience for moderation (fake, spam, PII, offensive).",
        request=ExperienceReportInputSerializer,
        responses={200: dict},
    )
    def post(self, request, experience_id):
        serializer = ExperienceReportInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = ExperienceService.submit_report(
            user=request.user,
            experience_id=experience_id,
            reason=serializer.validated_data["reason"],
            explanation=serializer.validated_data.get("explanation", ""),
        )
        return Response({"status": "success", "data": result})


class ExperienceTaxonomyView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Get Experience Discovery Taxonomy",
        description="Returns available filter options including companies, roles, salary tiers, and experience levels.",
        responses={200: dict},
    )
    def get(self, request):
        companies = (
            InterviewExperience.objects.filter(
                status=InterviewExperience.STATUS_PUBLISHED, is_hidden=False
            )
            .values_list("company_name", flat=True)
            .distinct()
        )
        roles = (
            InterviewExperience.objects.filter(
                status=InterviewExperience.STATUS_PUBLISHED, is_hidden=False
            )
            .values_list("role", flat=True)
            .distinct()
        )

        return Response(
            {
                "status": "success",
                "data": {
                    "companies": sorted([c for c in companies if c]),
                    "roles": sorted([r for r in roles if r]),
                    "experience_levels": [
                        "Fresher",
                        "0-1 Years",
                        "1-3 Years",
                        "3-5 Years",
                        "5+ Years",
                    ],
                    "salary_ranges": [
                        "₹3 - ₹6 LPA",
                        "₹6 - ₹10 LPA",
                        "₹10 - ₹18 LPA",
                        "₹18 - ₹30 LPA",
                        "₹30+ LPA",
                    ],
                    "outcomes": [
                        {"value": "selected", "label": "Selected / Offered"},
                        {"value": "rejected", "label": "Rejected"},
                        {"value": "awaited", "label": "Result Awaited"},
                        {"value": "withdrew", "label": "Withdrew / Did Not Complete"},
                    ],
                    "modes": ["Online", "Offline", "Hybrid"],
                    "difficulties": ["Easy", "Medium", "Hard", "Very Hard"],
                },
            }
        )
