from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.accounts.serializers import (
    UserProfileSerializer,
    ChangePasswordSerializer,
    EmailChangeRequestSerializer,
    EmailChangeConfirmSerializer,
    AccountDeleteSerializer,
)
from apps.accounts.services import auth_service


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Profile",
        description="Retrieve the authenticated user's profile and settings.",
        responses={200: UserProfileSerializer},
    )
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(
            {
                "status": "success",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Update Profile",
        description="Update profile information such as full name, phone number, target role, experience, and target salary.",
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer},
    )
    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "status": "success",
                "message": "Profile updated successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Change Password",
        description="Change user password with validation of current password.",
        request=ChangePasswordSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        auth_service.change_password(
            user=request.user,
            current_password=serializer.validated_data["current_password"],
            new_password=serializer.validated_data["new_password"],
        )
        return Response(
            {
                "status": "success",
                "message": "Password changed successfully. Existing sessions have been invalidated.",
            },
            status=status.HTTP_200_OK,
        )


class EmailChangeRequestView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Request Email Change",
        description="Request an email address update. Sends verification code to the new email address.",
        request=EmailChangeRequestSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = EmailChangeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        auth_service.request_email_change(
            user=request.user,
            new_email=serializer.validated_data["new_email"],
            password=serializer.validated_data["password"],
        )
        return Response(
            {
                "status": "success",
                "message": "Verification code sent to the new email address.",
            },
            status=status.HTTP_200_OK,
        )


class EmailChangeConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Confirm Email Change",
        description="Confirm email change using the verification code received on the new email address.",
        request=EmailChangeConfirmSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = EmailChangeConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        auth_service.confirm_email_change(
            user=request.user,
            new_email=serializer.validated_data["new_email"],
            code=serializer.validated_data["code"],
        )
        return Response(
            {
                "status": "success",
                "message": "Email address updated successfully.",
                "data": {"email": request.user.email},
            },
            status=status.HTTP_200_OK,
        )


class AccountDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Delete Account",
        description="Permanently delete user account. Requires password and typed 'DELETE' confirmation.",
        request=AccountDeleteSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = AccountDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        auth_service.delete_user_account(
            user=request.user,
            password=serializer.validated_data["password"],
            confirmation=serializer.validated_data["confirmation"],
        )
        return Response(
            {
                "status": "success",
                "message": "Account has been permanently deleted.",
            },
            status=status.HTTP_200_OK,
        )
