from django.urls import path
from apps.experiences.views import (
    ExperiencePublicListView,
    ExperiencePublicDetailView,
    MyExperiencesListView,
    ExperienceDraftCreateView,
    ExperienceDraftUpdateView,
    ExperiencePublishView,
    ExperienceEditPublishedView,
    ExperienceDeleteView,
    ExperienceHelpfulVoteView,
    ExperienceReportView,
    ExperienceTaxonomyView,
)

app_name = "experiences"

urlpatterns = [
    path("", ExperiencePublicListView.as_view(), name="experience-list"),
    path("taxonomy/", ExperienceTaxonomyView.as_view(), name="experience-taxonomy"),
    path("my/", MyExperiencesListView.as_view(), name="my-experiences"),
    path("drafts/", ExperienceDraftCreateView.as_view(), name="experience-draft-create"),
    path(
        "drafts/<uuid:experience_id>/",
        ExperienceDraftUpdateView.as_view(),
        name="experience-draft-update",
    ),
    path(
        "<uuid:experience_id>/",
        ExperiencePublicDetailView.as_view(),
        name="experience-detail",
    ),
    path(
        "<uuid:experience_id>/publish/",
        ExperiencePublishView.as_view(),
        name="experience-publish",
    ),
    path(
        "<uuid:experience_id>/edit-published/",
        ExperienceEditPublishedView.as_view(),
        name="experience-edit-published",
    ),
    path(
        "<uuid:experience_id>/delete/",
        ExperienceDeleteView.as_view(),
        name="experience-delete",
    ),
    path(
        "<uuid:experience_id>/helpful/",
        ExperienceHelpfulVoteView.as_view(),
        name="experience-helpful-vote",
    ),
    path(
        "<uuid:experience_id>/report/",
        ExperienceReportView.as_view(),
        name="experience-report",
    ),
]
