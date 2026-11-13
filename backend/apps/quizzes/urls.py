from django.urls import path
from apps.quizzes.views import (
    WeeklyQuizAssignmentOverviewView,
    WeeklyQuizStartView,
    QuizAutosaveView,
    QuizAbandonView,
    QuizSubmitView,
    QuizResultsView,
    WeeklyQuizHistoryView,
)

urlpatterns = [
    path(
        "weeks/<int:week_number>/assignment/",
        WeeklyQuizAssignmentOverviewView.as_view(),
        name="weekly-quiz-overview",
    ),
    path(
        "weeks/<int:week_number>/start/",
        WeeklyQuizStartView.as_view(),
        name="weekly-quiz-start",
    ),
    path(
        "weeks/<int:week_number>/history/",
        WeeklyQuizHistoryView.as_view(),
        name="weekly-quiz-history",
    ),
    path(
        "attempts/<uuid:attempt_id>/answers/",
        QuizAutosaveView.as_view(),
        name="quiz-attempt-autosave",
    ),
    path(
        "attempts/<uuid:attempt_id>/abandon/",
        QuizAbandonView.as_view(),
        name="quiz-attempt-abandon",
    ),
    path(
        "attempts/<uuid:attempt_id>/submit/",
        QuizSubmitView.as_view(),
        name="quiz-attempt-submit",
    ),
    path(
        "attempts/<uuid:attempt_id>/results/",
        QuizResultsView.as_view(),
        name="quiz-attempt-results",
    ),
]
