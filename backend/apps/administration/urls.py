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
from apps.administration.views_aptitude import (
    AdminAptitudeQuestionListView,
    AdminAptitudeQuestionDetailView,
    AdminAptitudeQuestionNewVersionView,
    AdminAptitudeQuestionStatusView,
    AdminAptitudeReportsListView,
    AdminAptitudeReportResolveView,
    AdminAptitudeConfigView,
)
from apps.interviews.views import (
    AdminInterviewConfigView,
    AdminInterviewAnalyticsView,
)
from apps.administration.views_experiences import (
    AdminExperienceModerationQueueView,
    AdminExperienceModerationDetailView,
    AdminExperienceModerationActionView,
    AdminExperienceReportsListView,
    AdminExperienceReportResolveView,
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
    # Admin Aptitude Management
    path(
        "aptitude/questions/",
        AdminAptitudeQuestionListView.as_view(),
        name="admin-aptitude-questions-list",
    ),
    path(
        "aptitude/questions/<uuid:question_id>/",
        AdminAptitudeQuestionDetailView.as_view(),
        name="admin-aptitude-question-detail",
    ),
    path(
        "aptitude/questions/<uuid:question_id>/version/",
        AdminAptitudeQuestionNewVersionView.as_view(),
        name="admin-aptitude-question-new-version",
    ),
    path(
        "aptitude/questions/<uuid:question_id>/status/",
        AdminAptitudeQuestionStatusView.as_view(),
        name="admin-aptitude-question-status",
    ),
    path(
        "aptitude/reports/",
        AdminAptitudeReportsListView.as_view(),
        name="admin-aptitude-reports-list",
    ),
    path(
        "aptitude/reports/<uuid:report_id>/resolve/",
        AdminAptitudeReportResolveView.as_view(),
        name="admin-aptitude-report-resolve",
    ),
    path(
        "aptitude/config/",
        AdminAptitudeConfigView.as_view(),
        name="admin-aptitude-config",
    ),
    # Admin Interview Practice Management
    path(
        "interviews/config/",
        AdminInterviewConfigView.as_view(),
        name="admin-interviews-config",
    ),
    path(
        "interviews/analytics/",
        AdminInterviewAnalyticsView.as_view(),
        name="admin-interviews-analytics",
    ),
    # Admin Experience Moderation
    path(
        "experiences/",
        AdminExperienceModerationQueueView.as_view(),
        name="admin-experiences-queue",
    ),
    path(
        "experiences/reports/",
        AdminExperienceReportsListView.as_view(),
        name="admin-experiences-reports-list",
    ),
    path(
        "experiences/reports/<uuid:report_id>/resolve/",
        AdminExperienceReportResolveView.as_view(),
        name="admin-experiences-report-resolve",
    ),
    path(
        "experiences/<uuid:experience_id>/",
        AdminExperienceModerationDetailView.as_view(),
        name="admin-experience-detail",
    ),
    path(
        "experiences/<uuid:experience_id>/action/",
        AdminExperienceModerationActionView.as_view(),
        name="admin-experience-action",
    ),
]
