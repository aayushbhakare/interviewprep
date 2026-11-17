from django.urls import path

from apps.accounts.views_admin_auth import (
    AdminLoginView,
    Admin2FAVerifyView,
    AdminInviteView,
    AdminAcceptInviteView,
)
from apps.administration.views_dashboard import AdminDashboardOverviewView
from apps.administration.views_students import (
    AdminStudentListView,
    AdminStudentDetailView,
    AdminStudentSuspendView,
    AdminStudentReactivateView,
)
from apps.administration.views_learning import (
    AdminLearningTopicListView,
    AdminLearningTopicDetailView,
    AdminLearningTopicCreateOrVersionView,
    AdminLearningTopicStatusView,
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
from apps.administration.views_settings import (
    AdminPlatformSettingsListView,
    AdminPlatformSettingUpdateView,
)
from apps.administration.views_ai_models import (
    AdminAIModelsListView,
    AdminAIModelUpdateView,
)
from apps.administration.views_monitoring import (
    AdminMonitoringView,
    AdminJobRetryView,
)
from apps.administration.views_activity_logs import AdminActivityLogListView
from apps.administration.views_maintenance import AdminMaintenanceView
from apps.administration.views_admins import (
    AdminAccountListView,
    AdminAccountDeactivateView,
    AdminAccountReactivateView,
    AdminInvitationListView,
    AdminInvitationRevokeView,
)

urlpatterns = [
    # 1. Admin Authentication & Invitations
    path("auth/login/", AdminLoginView.as_view(), name="admin-auth-login"),
    path(
        "auth/2fa/verify/",
        Admin2FAVerifyView.as_view(),
        name="admin-auth-2fa-verify",
    ),
    path("invitations/", AdminInviteView.as_view(), name="admin-invite"),
    path("invitations/list/", AdminInvitationListView.as_view(), name="admin-invitations-list"),
    path(
        "invitations/<int:invitation_id>/revoke/",
        AdminInvitationRevokeView.as_view(),
        name="admin-invitation-revoke",
    ),
    path(
        "invitations/accept/",
        AdminAcceptInviteView.as_view(),
        name="admin-accept-invite",
    ),

    # 2. Centralized Dashboard
    path("dashboard/", AdminDashboardOverviewView.as_view(), name="admin-dashboard-overview"),
    path("stats/", AdminDashboardOverviewView.as_view(), name="admin-stats"),

    # 3. Student Management
    path("students/", AdminStudentListView.as_view(), name="admin-students-list"),
    path("students/<uuid:student_id>/", AdminStudentDetailView.as_view(), name="admin-student-detail"),
    path("students/<uuid:student_id>/suspend/", AdminStudentSuspendView.as_view(), name="admin-student-suspend"),
    path("students/<uuid:student_id>/reactivate/", AdminStudentReactivateView.as_view(), name="admin-student-reactivate"),

    # 4. Learning Content Management
    path("learning/topics/", AdminLearningTopicListView.as_view(), name="admin-learning-topics-list"),
    path("learning/topics/new/", AdminLearningTopicCreateOrVersionView.as_view(), name="admin-learning-topic-create"),
    path("learning/topics/<uuid:topic_id>/", AdminLearningTopicDetailView.as_view(), name="admin-learning-topic-detail"),
    path("learning/topics/<uuid:topic_id>/version/", AdminLearningTopicCreateOrVersionView.as_view(), name="admin-learning-topic-version"),
    path("learning/topics/<uuid:topic_id>/status/", AdminLearningTopicStatusView.as_view(), name="admin-learning-topic-status"),

    # 5. Technical Question Bank Management
    path("questions/", AdminQuestionListView.as_view(), name="admin-questions-list"),
    path("questions/reports/", AdminQuestionReportsListView.as_view(), name="admin-questions-reports-list"),
    path("questions/reports/<uuid:report_id>/", AdminQuestionReportDetailView.as_view(), name="admin-questions-report-detail"),
    path("questions/<uuid:question_id>/", AdminQuestionDetailView.as_view(), name="admin-question-detail"),
    path("questions/<uuid:question_id>/versions/", AdminQuestionNewVersionView.as_view(), name="admin-question-new-version"),
    path("questions/<uuid:question_id>/status/", AdminQuestionStatusView.as_view(), name="admin-question-status"),

    # 6. Aptitude Management
    path("aptitude/questions/", AdminAptitudeQuestionListView.as_view(), name="admin-aptitude-questions-list"),
    path("aptitude/questions/<uuid:question_id>/", AdminAptitudeQuestionDetailView.as_view(), name="admin-aptitude-question-detail"),
    path("aptitude/questions/<uuid:question_id>/version/", AdminAptitudeQuestionNewVersionView.as_view(), name="admin-aptitude-question-new-version"),
    path("aptitude/questions/<uuid:question_id>/status/", AdminAptitudeQuestionStatusView.as_view(), name="admin-aptitude-question-status"),
    path("aptitude/reports/", AdminAptitudeReportsListView.as_view(), name="admin-aptitude-reports-list"),
    path("aptitude/reports/<uuid:report_id>/resolve/", AdminAptitudeReportResolveView.as_view(), name="admin-aptitude-report-resolve"),
    path("aptitude/config/", AdminAptitudeConfigView.as_view(), name="admin-aptitude-config"),

    # 7. Interview Practice Management
    path("interviews/config/", AdminInterviewConfigView.as_view(), name="admin-interviews-config"),
    path("interviews/analytics/", AdminInterviewAnalyticsView.as_view(), name="admin-interviews-analytics"),

    # 8. Experience Moderation
    path("experiences/", AdminExperienceModerationQueueView.as_view(), name="admin-experiences-queue"),
    path("experiences/reports/", AdminExperienceReportsListView.as_view(), name="admin-experiences-reports-list"),
    path("experiences/reports/<uuid:report_id>/resolve/", AdminExperienceReportResolveView.as_view(), name="admin-experiences-report-resolve"),
    path("experiences/<uuid:experience_id>/", AdminExperienceModerationDetailView.as_view(), name="admin-experience-detail"),
    path("experiences/<uuid:experience_id>/action/", AdminExperienceModerationActionView.as_view(), name="admin-experience-action"),

    # 9. Centralized Platform Settings
    path("settings/", AdminPlatformSettingsListView.as_view(), name="admin-settings-list"),
    path("settings/<str:key>/", AdminPlatformSettingUpdateView.as_view(), name="admin-setting-update"),

    # 10. AI Model & Provider Management
    path("ai-models/", AdminAIModelsListView.as_view(), name="admin-ai-models-list"),
    path("ai-models/<str:service_key>/", AdminAIModelUpdateView.as_view(), name="admin-ai-model-update"),

    # 11. System Health & Telemetry Monitoring
    path("monitoring/", AdminMonitoringView.as_view(), name="admin-monitoring"),
    path("monitoring/jobs/<uuid:job_id>/retry/", AdminJobRetryView.as_view(), name="admin-job-retry"),

    # 12. Immutable Admin Activity Logs
    path("activity-logs/", AdminActivityLogListView.as_view(), name="admin-activity-logs-list"),

    # 13. Maintenance Controls
    path("maintenance/", AdminMaintenanceView.as_view(), name="admin-maintenance"),

    # 14. Admin Account Management
    path("admins/", AdminAccountListView.as_view(), name="admin-accounts-list"),
    path("admins/<uuid:admin_id>/deactivate/", AdminAccountDeactivateView.as_view(), name="admin-account-deactivate"),
    path("admins/<uuid:admin_id>/reactivate/", AdminAccountReactivateView.as_view(), name="admin-account-reactivate"),
]
