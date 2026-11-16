from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from apps.accounts.serializers import (
    RegisterSerializer,
    VerifyEmailSerializer,
    ResendVerificationCodeSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from apps.accounts.services import auth_service


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Student Registration",
        description="Register a new student account using name, email, and password. Sends a verification code to the email.",
        request=RegisterSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = auth_service.register_student(
            full_name=serializer.validated_data["full_name"],
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        return Response(
            {
                "status": "success",
                "message": "Registration successful. Please verify your email using the code sent.",
                "data": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Verify Email Code",
        description="Verify user account using the 6-digit code received via email.",
        request=VerifyEmailSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = auth_service.verify_email(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
        )
        return Response(
            {
                "status": "success",
                "message": "Email verified successfully. You can now log in.",
                "data": {
                    "email": user.email,
                    "is_verified": user.is_verified,
                },
            },
            status=status.HTTP_200_OK,
        )


class ResendVerificationCodeView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Resend Email Verification Code",
        description="Request a fresh verification code if the previous one expired or was lost.",
        request=ResendVerificationCodeSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = ResendVerificationCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        auth_service.resend_verification_code(email=serializer.validated_data["email"])
        return Response(
            {
                "status": "success",
                "message": "A new verification code has been sent if the email is registered and unverified.",
            },
            status=status.HTTP_200_OK,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="User Login",
        description="Authenticate with email and password to receive JWT access and refresh tokens.",
        request=LoginSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        login_data = auth_service.login_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        return Response(
            {
                "status": "success",
                "data": login_data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="User Logout",
        description="Invalidate current refresh token and securely log out.",
        request={"application/json": {"type": "object", "properties": {"refresh": {"type": "string"}}}},
        responses={200: dict},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Token may already be blacklisted or invalid
        return Response(
            {
                "status": "success",
                "message": "Successfully logged out.",
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Request Password Reset",
        description="Request a password reset code sent to the registered email.",
        request=PasswordResetRequestSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        auth_service.request_password_reset(email=serializer.validated_data["email"])
        return Response(
            {
                "status": "success",
                "message": "If an account exists with this email, a password reset code has been sent.",
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Confirm Password Reset",
        description="Reset password using the received code.",
        request=PasswordResetConfirmSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        auth_service.confirm_password_reset(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
            new_password=serializer.validated_data["new_password"],
        )
        return Response(
            {
                "status": "success",
                "message": "Password has been successfully reset. You can now log in.",
            },
            status=status.HTTP_200_OK,
        )
