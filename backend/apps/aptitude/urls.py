from django.urls import path
from apps.aptitude.views import (
    AptitudeConfigView,
    AptitudeStartSessionView,
    AptitudeSessionDetailView,
    AptitudeAutosaveView,
    AptitudeAbandonView,
    AptitudeSubmitView,
    AptitudeResultsView,
    AptitudeHistoryView,
    AptitudeReportView,
)

urlpatterns = [
    path("config/", AptitudeConfigView.as_view(), name="aptitude-config"),
    path(
        "sessions/start/",
        AptitudeStartSessionView.as_view(),
        name="aptitude-session-start",
    ),
    path(
        "sessions/<uuid:session_id>/",
        AptitudeSessionDetailView.as_view(),
        name="aptitude-session-detail",
    ),
    path(
        "sessions/<uuid:session_id>/autosave/",
        AptitudeAutosaveView.as_view(),
        name="aptitude-session-autosave",
    ),
    path(
        "sessions/<uuid:session_id>/abandon/",
        AptitudeAbandonView.as_view(),
        name="aptitude-session-abandon",
    ),
    path(
        "sessions/<uuid:session_id>/submit/",
        AptitudeSubmitView.as_view(),
        name="aptitude-session-submit",
    ),
    path(
        "sessions/<uuid:session_id>/results/",
        AptitudeResultsView.as_view(),
        name="aptitude-session-results",
    ),
    path("history/", AptitudeHistoryView.as_view(), name="aptitude-history"),
    path(
        "questions/report/",
        AptitudeReportView.as_view(),
        name="aptitude-question-report",
    ),
]
