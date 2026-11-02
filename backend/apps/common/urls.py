from django.urls import path
from .views import HealthCheckView
from .views_dashboard import StudentDashboardView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path(
        "dashboard/student/", StudentDashboardView.as_view(), name="student-dashboard"
    ),
]
