from django.urls import path
from apps.learning.views import (
    CatalogView,
    ActiveRoadmapView,
    RoadmapCreateView,
    RoadmapReplaceView,
    TopicProgressUpdateView,
    TopicContentView,
)

urlpatterns = [
    path("catalog/", CatalogView.as_view(), name="learning-catalog"),
    path("roadmaps/active/", ActiveRoadmapView.as_view(), name="learning-roadmap-active"),
    path("roadmaps/", RoadmapCreateView.as_view(), name="learning-roadmap-create"),
    path("roadmaps/replace/", RoadmapReplaceView.as_view(), name="learning-roadmap-replace"),
    path("topics/<uuid:topic_id>/progress/", TopicProgressUpdateView.as_view(), name="learning-topic-progress"),
    path("topics/<uuid:topic_id>/content/", TopicContentView.as_view(), name="learning-topic-content"),
]
