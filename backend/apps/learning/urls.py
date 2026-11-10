from django.urls import path
from apps.learning.views import (
    CatalogView,
    ActiveRoadmapView,
    RoadmapStatusView,
    RoadmapCreateView,
    RoadmapReplaceView,
    TopicProgressUpdateView,
    TopicContentView,
    PracticeTaskDetailView,
    PracticeTaskProgressUpdateView,
)

urlpatterns = [
    path("catalog/", CatalogView.as_view(), name="learning-catalog"),
    path(
        "roadmaps/active/", ActiveRoadmapView.as_view(), name="learning-roadmap-active"
    ),
    path(
        "roadmaps/status/", RoadmapStatusView.as_view(), name="learning-roadmap-status"
    ),
    path("roadmaps/", RoadmapCreateView.as_view(), name="learning-roadmap-create"),
    path(
        "roadmaps/replace/",
        RoadmapReplaceView.as_view(),
        name="learning-roadmap-replace",
    ),
    path(
        "topics/<uuid:topic_id>/progress/",
        TopicProgressUpdateView.as_view(),
        name="learning-topic-progress",
    ),
    path(
        "topics/<uuid:topic_id>/content/",
        TopicContentView.as_view(),
        name="learning-topic-content",
    ),
    path(
        "practice-tasks/<uuid:task_id>/",
        PracticeTaskDetailView.as_view(),
        name="learning-practice-task-detail",
    ),
    path(
        "practice-tasks/<uuid:task_id>/progress/",
        PracticeTaskProgressUpdateView.as_view(),
        name="learning-practice-task-progress",
    ),
]
