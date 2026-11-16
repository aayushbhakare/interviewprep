from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.accounts.views_admin_auth import (
    AdminLoginView,
    Admin2FAVerifyView,
    AdminInviteView,
    AdminAcceptInviteView,
)
from apps.administration.views_questions import (
    AdminQuestionListView,
    AdminQuestionDetailView,
    AdminQuestionNewVersionView,
    AdminQuestionStatusView,
    AdminQuestionReportsListView,
    AdminQuestionReportDetailView,
)


class AdminPlaceholderView(APIView):
    @extend_schema(responses={200: dict})
    def get(self, request):
        return Response({"status": "success", "data": {"stats": {}}})


urlpatterns = [
    # Admin Authentication & Invitations
    path("auth/login/", AdminLoginView.as_view(), name="admin-auth-login"),
    path(
        "auth/2fa/verify/", Admin2FAVerifyView.as_view(), name="admin-auth-2fa-verify"
    ),
    path("invitations/", AdminInviteView.as_view(), name="admin-invite"),
    path(
        "invitations/accept/",
        AdminAcceptInviteView.as_view(),
        name="admin-accept-invite",
    ),
    # Existing Admin Overview
    path("stats/", AdminPlaceholderView.as_view(), name="admin-stats"),
    # Admin Question Bank Management
    path("questions/", AdminQuestionListView.as_view(), name="admin-questions-list"),
    path(
        "questions/reports/",
        AdminQuestionReportsListView.as_view(),
        name="admin-questions-reports-list",
    ),
    path(
        "questions/reports/<uuid:report_id>/",
        AdminQuestionReportDetailView.as_view(),
        name="admin-questions-report-detail",
    ),
    path(
        "questions/<uuid:question_id>/",
        AdminQuestionDetailView.as_view(),
        name="admin-question-detail",
    ),
    path(
        "questions/<uuid:question_id>/versions/",
        AdminQuestionNewVersionView.as_view(),
        name="admin-question-new-version",
    ),
    path(
        "questions/<uuid:question_id>/status/",
        AdminQuestionStatusView.as_view(),
        name="admin-question-status",
    ),
]
