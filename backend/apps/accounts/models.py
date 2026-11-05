import uuid
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from apps.common.models import TimeStampedModel


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, full_name="", **extra_fields):
        if not email:
            raise ValueError("Email address is mandatory")
        email = self.normalize_email(email).lower().strip()
        user = self.model(email=email, full_name=full_name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        UserProfile.objects.get_or_create(user=user)
        return user

    def create_superuser(self, email, password=None, full_name="Admin", **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)
        extra_fields.setdefault("is_admin_2fa_enabled", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, full_name=full_name, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    # Mandatory 2FA for admin accounts
    is_admin_2fa_enabled = models.BooleanField(default=False)
    admin_2fa_secret = models.CharField(max_length=128, blank=True, null=True)

    # Account suspension controls (managed by Admins)
    is_suspended = models.BooleanField(default=False)
    suspension_reason = models.TextField(blank=True, default="")

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({self.full_name})"


class UserProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    target_role = models.CharField(max_length=100, blank=True, null=True)
    experience_level = models.CharField(max_length=50, blank=True, null=True)
    target_salary = models.CharField(max_length=50, blank=True, null=True)
    current_resume_path = models.CharField(max_length=500, blank=True, null=True)
    current_resume_version = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Profile of {self.user.email}"


class EmailVerificationCode(TimeStampedModel):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="verification_codes"
    )
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]


class PasswordResetToken(TimeStampedModel):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="password_reset_tokens"
    )
    token_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]


class EmailChangeRequest(TimeStampedModel):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="email_change_requests"
    )
    new_email = models.EmailField()
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]


class AdminInvitation(TimeStampedModel):
    email = models.EmailField(unique=True)
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_admin_invitations",
    )
    token_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_accepted = models.BooleanField(default=False)
    is_revoked = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]


class TwoFactorCode(TimeStampedModel):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="two_factor_codes"
    )
    code_hash = models.CharField(max_length=128)
    temp_token = models.CharField(max_length=128, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]


class UserResumeVersion(TimeStampedModel):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="resume_versions"
    )
    version_number = models.PositiveIntegerField()
    storage_path = models.CharField(max_length=500)
    original_filename = models.CharField(max_length=255)
    file_size_bytes = models.PositiveIntegerField()

    class Meta:
        unique_together = ("user", "version_number")
        ordering = ["-version_number"]
