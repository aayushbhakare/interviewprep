from django.urls import path
from apps.interviews.views import (
    InterviewAbandonView,
    InterviewCompleteAptitudeStageView,
    InterviewEligibilityView,
    InterviewEvaluateView,
    InterviewHistoryDetailView,
    InterviewHistoryListView,
    InterviewResultsView,
    InterviewSessionDetailView,
    InterviewSetupPrepopulateView,
    InterviewStartSessionView,
    InterviewTurnView,
)

urlpatterns = [
    path("eligibility/", InterviewEligibilityView.as_view(), name="interview-eligibility"),
    path("setup-prepopulate/", InterviewSetupPrepopulateView.as_view(), name="interview-setup-prepopulate"),
    path("sessions/start/", InterviewStartSessionView.as_view(), name="interview-start-session"),
    path("sessions/<uuid:session_id>/", InterviewSessionDetailView.as_view(), name="interview-session-detail"),
    path("sessions/<uuid:session_id>/turns/", InterviewTurnView.as_view(), name="interview-turn"),
    path("sessions/<uuid:session_id>/rounds/complete-aptitude/", InterviewCompleteAptitudeStageView.as_view(), name="interview-complete-aptitude-stage"),
    path("sessions/<uuid:session_id>/evaluate/", InterviewEvaluateView.as_view(), name="interview-evaluate"),
    path("sessions/<uuid:session_id>/results/", InterviewResultsView.as_view(), name="interview-results"),
    path("sessions/<uuid:session_id>/abandon/", InterviewAbandonView.as_view(), name="interview-abandon"),
    path("history/", InterviewHistoryListView.as_view(), name="interview-history-list"),
    path("history/<uuid:session_id>/", InterviewHistoryDetailView.as_view(), name="interview-history-detail"),
]
