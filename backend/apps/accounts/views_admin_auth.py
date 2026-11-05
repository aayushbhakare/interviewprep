from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from drf_spectacular.utils import extend_schema

from apps.accounts.serializers import (
    AdminLoginSerializer,
    Admin2FAVerifySerializer,
    AdminInviteSerializer,
    AdminAcceptInviteSerializer,
)
from apps.accounts.services import auth_service


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Admin Login (Step 1)",
        description="Authenticate administrator credentials. Triggers email 2FA code dispatch.",
        request=AdminLoginSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = auth_service.admin_login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        return Response(
            {
                "status": "success",
                "data": result,
            },
            status=status.HTTP_200_OK,
        )


class Admin2FAVerifyView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Admin 2FA Verification (Step 2)",
        description="Verify the 6-digit two-factor authentication code to complete administrator login.",
        request=Admin2FAVerifySerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = Admin2FAVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        login_data = auth_service.verify_admin_2fa(
            temp_token=serializer.validated_data["temp_token"],
            code=serializer.validated_data["code"],
        )
        return Response(
            {
                "status": "success",
                "data": login_data,
            },
            status=status.HTTP_200_OK,
        )


class AdminInviteView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Invite New Administrator",
        description="Existing administrators can invite a new administrator via email.",
        request=AdminInviteSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = AdminInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = auth_service.invite_admin(
            invited_by=request.user,
            email=serializer.validated_data["email"],
        )
        return Response(
            {
                "status": "success",
                "message": f"Invitation email sent to {invitation.email}.",
                "data": {
                    "email": invitation.email,
                    "expires_at": invitation.expires_at,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class AdminAcceptInviteView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Accept Administrator Invitation",
        description="Onboard as an administrator using the security token sent in the invitation email.",
        request=AdminAcceptInviteSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = AdminAcceptInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = auth_service.accept_admin_invitation(
            invite_token=serializer.validated_data["token"],
            full_name=serializer.validated_data["full_name"],
            password=serializer.validated_data["password"],
        )
        return Response(
            {
                "status": "success",
                "message": "Administrator account configured successfully. You may now log in.",
                "data": {
                    "email": user.email,
                    "full_name": user.full_name,
                },
            },
            status=status.HTTP_201_CREATED,
        )
