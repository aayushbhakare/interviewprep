from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema


class ExperiencePlaceholderView(APIView):
    @extend_schema(responses={200: dict})
    def get(self, request):
        return Response({"status": "success", "data": {"experiences": []}})


urlpatterns = [
    path("", ExperiencePlaceholderView.as_view(), name="experiences-list"),
]
