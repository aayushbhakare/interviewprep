from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema


class QuizPlaceholderView(APIView):
    @extend_schema(responses={200: dict})
    def get(self, request):
        return Response({"status": "success", "data": {"quizzes": []}})


urlpatterns = [
    path("history/", QuizPlaceholderView.as_view(), name="quizzes-history"),
]
