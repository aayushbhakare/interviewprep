from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema


class InterviewPlaceholderView(APIView):
    @extend_schema(responses={200: dict})
    def get(self, request):
        return Response({"status": "success", "data": {"interviews": []}})


urlpatterns = [
    path("history/", InterviewPlaceholderView.as_view(), name="interviews-history"),
]
