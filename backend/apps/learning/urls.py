from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema


class LearningPlaceholderView(APIView):
    @extend_schema(responses={200: dict})
    def get(self, request):
        return Response({"status": "success", "data": {"roadmaps": []}})


urlpatterns = [
    path("roadmaps/", LearningPlaceholderView.as_view(), name="learning-roadmaps"),
]
