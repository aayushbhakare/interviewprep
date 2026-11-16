from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.accounts.views_admin_auth import (
    AdminLoginView,
    Admin2FAVerifyView,
    AdminInviteView,
    AdminAcceptInviteView,
)


class AdminPlaceholderView(APIView):
    @extend_schema(responses={200: dict})
    def get(self, request):
        return Response({"status": "success", "data": {"stats": {}}})


urlpatterns = [
    # Admin Authentication & Invitations
    path('auth/login/', AdminLoginView.as_view(), name='admin-auth-login'),
    path('auth/2fa/verify/', Admin2FAVerifyView.as_view(), name='admin-auth-2fa-verify'),
    path('invitations/', AdminInviteView.as_view(), name='admin-invite'),
    path('invitations/accept/', AdminAcceptInviteView.as_view(), name='admin-accept-invite'),

    # Existing Admin Overview
    path('stats/', AdminPlaceholderView.as_view(), name='admin-stats'),
]
