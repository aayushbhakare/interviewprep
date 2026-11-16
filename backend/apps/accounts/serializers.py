from rest_framework import serializers
from apps.accounts.models import User


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": ["Passwords do not match."]}
            )
        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6, min_length=6, required=True)


class ResendVerificationCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6, required=True)
    new_password = serializers.CharField(write_only=True, min_length=8, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": ["Passwords do not match."]}
            )
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)
    full_name = serializers.CharField(max_length=255)
    phone_number = serializers.CharField(
        source="profile.phone_number", allow_blank=True, allow_null=True, required=False
    )
    target_role = serializers.CharField(
        source="profile.target_role", allow_blank=True, allow_null=True, required=False
    )
    experience_level = serializers.CharField(
        source="profile.experience_level",
        allow_blank=True,
        allow_null=True,
        required=False,
    )
    target_salary = serializers.CharField(
        source="profile.target_salary",
        allow_blank=True,
        allow_null=True,
        required=False,
    )
    current_resume_path = serializers.CharField(
        source="profile.current_resume_path", read_only=True
    )
    current_resume_version = serializers.IntegerField(
        source="profile.current_resume_version", read_only=True
    )
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "phone_number",
            "target_role",
            "experience_level",
            "target_salary",
            "current_resume_path",
            "current_resume_version",
            "is_verified",
            "is_staff",
            "created_at",
        ]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        instance.full_name = validated_data.get("full_name", instance.full_name)
        instance.save()

        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, min_length=8, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": ["Passwords do not match."]}
            )
        return attrs


class EmailChangeRequestSerializer(serializers.Serializer):
    new_email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class EmailChangeConfirmSerializer(serializers.Serializer):
    new_email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6, required=True)


class AccountDeleteSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)
    confirmation = serializers.CharField(required=True)


# -------------------------------------------------------------
# Admin Serializers
# -------------------------------------------------------------


class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class Admin2FAVerifySerializer(serializers.Serializer):
    temp_token = serializers.CharField(required=True)
    code = serializers.CharField(max_length=6, required=True)


class AdminInviteSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class AdminAcceptInviteSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    full_name = serializers.CharField(max_length=255, required=True)
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": ["Passwords do not match."]}
            )
        return attrs
