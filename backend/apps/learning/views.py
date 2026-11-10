from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from drf_spectacular.utils import extend_schema

from apps.learning.models import (
    Roadmap,
    RoadmapTopicReference,
    RoadmapPracticeTask,
)
from django.db.models import Q
from apps.content.models import TopicContent
from apps.experiences.models import StudentReportedQuestion
from apps.learning.serializers import (
    RoadmapCreateSerializer,
    RoadmapDetailSerializer,
    TopicProgressUpdateSerializer,
    PracticeTaskProgressUpdateSerializer,
    PracticeTaskDetailSerializer,
    TopicContentSerializer,
)
from apps.learning.services.catalog_service import get_catalog_data
from apps.learning.services.roadmap_generator import generate_student_roadmap
from apps.learning.services.progress_service import (
    update_topic_progress,
    update_practice_progress,
)


def _enforce_verified_student(user):
    if not user.is_verified:
        raise PermissionDenied(
            "Email verification is required to access the Learn module."
        )


class CatalogView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Get Learning Catalog",
        description="Retrieve supported roles, experience tiers, salary bands, languages, framework compatibility matrix, and databases.",
        responses={200: dict},
    )
    def get(self, request):
        data = get_catalog_data()
        return Response({"status": "success", "data": data})


class ActiveRoadmapView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Active Roadmap",
        description="Retrieve the authenticated student's active roadmap with all phases, weeks, learning topics, and hands-on practice tasks.",
        responses={200: dict},
    )
    def get(self, request):
        _enforce_verified_student(request.user)
        roadmap = (
            Roadmap.objects.filter(user=request.user, is_active=True)
            .prefetch_related(
                "phases__weeks__topics",
                "phases__weeks__practice_tasks__related_topic",
                "topic_progresses",
                "practice_progresses",
            )
            .first()
        )
        if not roadmap:
            return Response({"status": "success", "data": None})

        serializer = RoadmapDetailSerializer(roadmap)
        return Response({"status": "success", "data": serializer.data})


class RoadmapStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Roadmap Generation Status",
        description="Retrieve generation status, preparation state, or errors for the student's active roadmap.",
        responses={200: dict},
    )
    def get(self, request):
        _enforce_verified_student(request.user)
        roadmap = Roadmap.objects.filter(user=request.user, is_active=True).first()
        if not roadmap:
            return Response(
                {
                    "status": "success",
                    "data": {"has_active_roadmap": False, "status": None},
                }
            )

        return Response(
            {
                "status": "success",
                "data": {
                    "has_active_roadmap": True,
                    "roadmap_id": str(roadmap.id),
                    "status": roadmap.status,
                    "is_ready": roadmap.status == Roadmap.STATUS_READY,
                    "generation_error": roadmap.generation_error,
                },
            }
        )


class RoadmapCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Generate Roadmap",
        description="Create and generate a personalized roadmap based on role, stack, salary tier, and experience.",
        request=RoadmapCreateSerializer,
        responses={201: dict},
    )
    def post(self, request):
        _enforce_verified_student(request.user)
        serializer = RoadmapCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        roadmap = generate_student_roadmap(
            user=request.user,
            data=serializer.validated_data,
            replace=serializer.validated_data.get("replace", False),
        )

        detail_serializer = RoadmapDetailSerializer(roadmap)
        return Response(
            {
                "status": "success",
                "message": "Roadmap successfully generated.",
                "data": detail_serializer.data,
            },
            status=201,
        )


class RoadmapReplaceView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Replace Existing Roadmap",
        description="Transactionally replace the active roadmap with a newly configured one. Preserves old roadmap if generation fails.",
        request=RoadmapCreateSerializer,
        responses={201: dict},
    )
    def post(self, request):
        _enforce_verified_student(request.user)
        serializer = RoadmapCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        roadmap = generate_student_roadmap(
            user=request.user,
            data=serializer.validated_data,
            replace=True,
        )

        detail_serializer = RoadmapDetailSerializer(roadmap)
        return Response(
            {
                "status": "success",
                "message": "Roadmap successfully replaced.",
                "data": detail_serializer.data,
            },
            status=201,
        )


class TopicProgressUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Update Topic Progress",
        description="Mark a learning topic as completed, not started, or skipped (Not Verified).",
        request=TopicProgressUpdateSerializer,
        responses={200: dict},
    )
    def patch(self, request, topic_id):
        _enforce_verified_student(request.user)
        serializer = TopicProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = update_topic_progress(
            user=request.user,
            topic_id=topic_id,
            new_status=serializer.validated_data["status"],
        )
        return Response({"status": "success", "data": result})


class TopicContentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Topic Learning Content",
        description="Retrieve learning objectives, concept explanation, internals, practical code, and interview perspectives for a topic.",
        responses={200: dict},
    )
    def get(self, request, topic_id):
        _enforce_verified_student(request.user)
        try:
            topic_ref = RoadmapTopicReference.objects.select_related(
                "week__phase__roadmap"
            ).get(id=topic_id)
        except (RoadmapTopicReference.DoesNotExist, ValueError):
            raise NotFound("Topic not found.")

        roadmap = topic_ref.week.phase.roadmap
        if roadmap.user_id != request.user.id or not roadmap.is_active:
            raise PermissionDenied("You do not have access to this topic.")

        content = (
            TopicContent.objects.filter(slug=topic_ref.topic_slug, is_published=True)
            .order_by("-version")
            .first()
        )

        reported_qs = (
            StudentReportedQuestion.objects.filter(is_active=True)
            .filter(
                Q(topic_slug=topic_ref.topic_slug)
                | Q(technology__iexact=roadmap.language)
                | Q(technology__icontains=topic_ref.title[:15])
            )
            .order_by("-report_count", "-created_at")[:10]
        )

        student_questions_data = [
            {
                "id": str(q.id),
                "question_text": q.question_text,
                "follow_up_text": q.follow_up_text,
                "role": q.role,
                "company_name": q.company_name,
                "salary_range": q.salary_range,
                "stage_type": q.stage_type,
                "report_count": q.report_count,
                "provenance_label": "Student Reported Interview Question",
            }
            for q in reported_qs
        ]

        if not content:
            data = {
                "id": str(topic_ref.id),
                "slug": topic_ref.topic_slug,
                "topic_name": topic_ref.title,
                "technology": roadmap.language,
                "version": 1,
                "learning_objectives": [
                    f"Master the core principles of {topic_ref.title}.",
                    "Analyze complexity and trade-offs in real production workloads.",
                    "Articulate technical decision criteria during recruitment interviews.",
                ],
                "concept_explanation": f"{topic_ref.title} is an essential technical requirement for {roadmap.role} roles at the {roadmap.target_salary or 'standard'} compensation level.",
                "how_it_works": "The runtime engine manages state allocation and execution scheduling to maintain data integrity.",
                "examples": [
                    {
                        "description": "Idiomatic Implementation",
                        "code": f"// Practical implementation for {topic_ref.title}\nfunction execute() {{\n  return true;\n}}",
                    }
                ],
                "practical_implementation": f"Implement {topic_ref.title} with comprehensive test coverage and automated linting.",
                "interview_perspective": f"Expect interview questions probing memory overhead, race conditions, and scaling limitations of {topic_ref.title}.",
                "key_takeaways": [
                    "Solidify the fundamentals before writing production code.",
                    "Always measure execution time and resource utilization.",
                ],
                "student_reported_questions": student_questions_data,
            }
            return Response({"status": "success", "data": data})

        res_data = dict(TopicContentSerializer(content).data)
        res_data["student_reported_questions"] = student_questions_data
        return Response({"status": "success", "data": res_data})


class PracticeTaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Practice Task Details",
        description="Retrieve hands-on practice task objective, problem statement, requirements, constraints, sample I/O, starter code, and hints.",
        responses={200: dict},
    )
    def get(self, request, task_id):
        _enforce_verified_student(request.user)
        try:
            task = (
                RoadmapPracticeTask.objects.select_related(
                    "week__phase__roadmap", "related_topic"
                )
                .prefetch_related("progress_records")
                .get(id=task_id)
            )
        except (RoadmapPracticeTask.DoesNotExist, ValueError):
            raise NotFound("Practice task not found.")

        roadmap = task.week.phase.roadmap
        if roadmap.user_id != request.user.id or not roadmap.is_active:
            raise PermissionDenied("You do not have access to this practice task.")

        serializer = PracticeTaskDetailSerializer(task, context={"user": request.user})
        return Response({"status": "success", "data": serializer.data})


class PracticeTaskProgressUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Update Practice Task Progress",
        description="Update progress state of a practice task (not_started, in_progress, completed) and save optional submission notes.",
        request=PracticeTaskProgressUpdateSerializer,
        responses={200: dict},
    )
    def patch(self, request, task_id):
        _enforce_verified_student(request.user)
        serializer = PracticeTaskProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = update_practice_progress(
            user=request.user,
            task_id=task_id,
            new_status=serializer.validated_data["status"],
            submission_notes=serializer.validated_data.get("submission_notes"),
        )
        return Response({"status": "success", "data": result})
