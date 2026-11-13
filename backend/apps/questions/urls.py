from django.urls import path
from apps.questions.views import QuestionReportView, QuestionCatalogView

urlpatterns = [
    path("catalog/", QuestionCatalogView.as_view(), name="question-catalog"),
    path(
        "<uuid:question_id>/report/",
        QuestionReportView.as_view(),
        name="question-report",
    ),
]
