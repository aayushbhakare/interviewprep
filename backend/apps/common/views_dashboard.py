from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.learning.models import Roadmap


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Student Dashboard Overview",
        description="Fetch active roadmap status, recent activity, shortcuts, and student overview.",
        responses={200: dict},
    )
    def get(self, request):
        user = request.user
        active_roadmap = Roadmap.objects.filter(user=user, is_active=True).first()

        roadmap_data = None
        if active_roadmap:
            total_topics = active_roadmap.topic_progresses.count()
            completed_topics = active_roadmap.topic_progresses.filter(
                status="completed"
            ).count()
            progress_pct = (
                int((completed_topics / total_topics) * 100) if total_topics > 0 else 0
            )

            roadmap_data = {
                "id": str(active_roadmap.id),
                "role": active_roadmap.role,
                "experience_level": active_roadmap.experience_level,
                "target_salary": active_roadmap.target_salary or "Flexible",
                "language": active_roadmap.language,
                "framework": active_roadmap.framework,
                "database": active_roadmap.database,
                "status": active_roadmap.status,
                "progress_percentage": progress_pct,
                "completed_topics": completed_topics,
                "total_topics": total_topics,
                "weekly_quiz_status": (
                    "Preparing" if active_roadmap.status == Roadmap.STATUS_PREPARING else "Available"
                ),
            }

        recent_activities = []
        if active_roadmap:
            recent_activities.append({
                "id": f"roadmap-{active_roadmap.id}",
                "type": "roadmap",
                "title": f"Started {active_roadmap.role} Roadmap",
                "description": f"Target: {active_roadmap.target_salary or 'Standard'} • {active_roadmap.language}/{active_roadmap.framework}",
                "timestamp": active_roadmap.created_at.isoformat(),
                "badge": "Roadmap",
            })

        shortcuts = [
            {
                "id": "learn",
                "title": "Personalized Roadmap",
                "description": "Build a self-paced curriculum for your target salary tier",
                "path": "/learn",
                "badge": "Core Pillar",
            },
            {
                "id": "practice",
                "title": "AI Voice Interviews",
                "description": "Simulate Technical, HR, and Mixed interview rounds",
                "path": "/practice",
                "badge": "Core Pillar",
            },
            {
                "id": "experiences",
                "title": "Interview Experiences",
                "description": "Read real recruitment stories and round breakdowns",
                "path": "/experiences",
                "badge": "Core Pillar",
            },
            {
                "id": "profile",
                "title": "Profile & Account",
                "description": "Manage contact details, credentials, and settings",
                "path": "/profile",
                "badge": "Account",
            },
        ]

        return Response({
            "status": "success",
            "data": {
                "user": {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "email": user.email,
                    "created_at": user.created_at.isoformat(),
                },
                "active_roadmap": roadmap_data,
                "recent_activities": recent_activities,
                "shortcuts": shortcuts,
            },
        })
