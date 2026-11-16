from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import connection
from drf_spectacular.utils import extend_schema


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="System Health Check",
        description="Verify backend server, database connection, and core services.",
        responses={200: dict},
    )
    def get(self, request):
        db_status = "healthy"
        try:
            connection.ensure_connection()
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"

        return Response(
            {
                "status": "success",
                "data": {
                    "server": "healthy",
                    "database": db_status,
                    "version": "1.0.0",
                    "mode": "development",
                },
            }
        )
