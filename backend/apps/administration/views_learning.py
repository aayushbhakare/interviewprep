from django.shortcuts import get_object_or_404
from django.db.models import Q, Max
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema

from apps.administration.permissions import IsPlatformAdmin
from apps.administration.services.activity_log_service import log_admin_activity
from apps.content.models import TopicContent


class TopicPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminLearningTopicListView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Browse Learning Content Topics",
        description="Filter by technology, publication status, or search topic names.",
        responses={200: dict},
    )
    def get(self, request):
        qs = TopicContent.objects.all().order_by("technology", "topic_name", "-version")

        technology = request.query_params.get("technology", "").strip()
        if technology:
            qs = qs.filter(technology__iexact=technology)

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(topic_name__icontains=search) | Q(slug__icontains=search)
            )

        published = request.query_params.get("published", "").strip().lower()
        if published == "true":
            qs = qs.filter(is_published=True)
        elif published == "false":
            qs = qs.filter(is_published=False)

        # Technologies taxonomy summary
        technologies = list(
            TopicContent.objects.values_list("technology", flat=True)
            .distinct()
            .order_by("technology")
        )

        paginator = TopicPagination()
        page = paginator.paginate_queryset(qs, request)

        results = []
        for t in page:
            results.append(
                {
                    "id": str(t.id),
                    "slug": t.slug,
                    "topic_name": t.topic_name,
                    "technology": t.technology,
                    "version": t.version,
                    "is_published": t.is_published,
                    "objectives_count": len(t.learning_objectives or []),
                    "examples_count": len(t.examples or []),
                    "created_at": t.created_at,
                    "updated_at": t.updated_at,
                }
            )

        resp = paginator.get_paginated_response(results)
        resp.data["technologies"] = technologies
        return resp


class AdminLearningTopicDetailView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Topic Content Deep-Dive & Version History",
        description="Inspect complete multi-section curriculum content and all historical versions.",
        responses={200: dict},
    )
    def get(self, request, topic_id):
        topic = get_object_or_404(TopicContent, id=topic_id)
        versions = TopicContent.objects.filter(slug=topic.slug).order_by("-version")

        version_history = [
            {
                "id": str(v.id),
                "version": v.version,
                "is_published": v.is_published,
                "created_at": v.created_at,
                "updated_at": v.updated_at,
            }
            for v in versions
        ]

        return Response(
            {
                "status": "success",
                "data": {
                    "id": str(topic.id),
                    "slug": topic.slug,
                    "topic_name": topic.topic_name,
                    "technology": topic.technology,
                    "version": topic.version,
                    "is_published": topic.is_published,
                    "learning_objectives": topic.learning_objectives or [],
                    "concept_explanation": topic.concept_explanation or "",
                    "how_it_works": topic.how_it_works or "",
                    "examples": topic.examples or [],
                    "practical_implementation": topic.practical_implementation or "",
                    "interview_perspective": topic.interview_perspective or "",
                    "key_takeaways": topic.key_takeaways or [],
                    "created_at": topic.created_at,
                    "updated_at": topic.updated_at,
                    "versions": version_history,
                },
            }
        )


class AdminLearningTopicCreateOrVersionView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Create or Publish New Version of Topic Content",
        description="Saves a new revision of topic content with incremented version number, preserving previous versions and student progress.",
        request={"application/json": {"properties": {"topic_name": {"type": "string"}}}},
        responses={201: dict},
    )
    def post(self, request, topic_id=None):
        data = request.data

        if topic_id:
            existing = get_object_or_404(TopicContent, id=topic_id)
            slug = existing.slug
            topic_name = data.get("topic_name", existing.topic_name)
            technology = data.get("technology", existing.technology)
            max_ver = TopicContent.objects.filter(slug=slug).aggregate(Max("version"))[
                "version__max"
            ] or 1
            new_version = max_ver + 1
        else:
            slug = data.get("slug", "").strip()
            topic_name = data.get("topic_name", "").strip()
            technology = data.get("technology", "").strip()
            if not slug or not topic_name or not technology:
                return Response(
                    {"detail": "slug, topic_name, and technology are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            new_version = 1

        new_content = TopicContent.objects.create(
            slug=slug,
            topic_name=topic_name,
            technology=technology,
            version=new_version,
            learning_objectives=data.get("learning_objectives", []),
            concept_explanation=data.get("concept_explanation", ""),
            how_it_works=data.get("how_it_works", ""),
            examples=data.get("examples", []),
            practical_implementation=data.get("practical_implementation", ""),
            interview_perspective=data.get("interview_perspective", ""),
            key_takeaways=data.get("key_takeaways", []),
            is_published=data.get("is_published", True),
        )

        log_admin_activity(
            actor=request.user,
            action="topic_content_version_created",
            resource_type="topic_content",
            resource_id=str(new_content.id),
            details={
                "slug": slug,
                "version": new_version,
                "technology": technology,
            },
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"Topic content v{new_version} published successfully.",
                "data": {
                    "id": str(new_content.id),
                    "slug": new_content.slug,
                    "version": new_content.version,
                    "is_published": new_content.is_published,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class AdminLearningTopicStatusView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Toggle Topic Content Publication Status",
        description="Publish or unpublish a specific topic content record.",
        request={"application/json": {"properties": {"is_published": {"type": "boolean"}}}},
        responses={200: dict},
    )
    def patch(self, request, topic_id):
        topic = get_object_or_404(TopicContent, id=topic_id)
        is_published = request.data.get("is_published", True)

        topic.is_published = bool(is_published)
        topic.save(update_fields=["is_published", "updated_at"])

        log_admin_activity(
            actor=request.user,
            action="topic_content_status_updated",
            resource_type="topic_content",
            resource_id=str(topic.id),
            details={"slug": topic.slug, "is_published": topic.is_published},
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"Topic '{topic.topic_name}' status updated to {'published' if topic.is_published else 'unpublished'}.",
                "data": {
                    "id": str(topic.id),
                    "is_published": topic.is_published,
                },
            }
        )
