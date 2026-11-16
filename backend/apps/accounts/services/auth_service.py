import hashlib
import secrets
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken,
    BlacklistedToken,
)

from apps.accounts.models import (
    User,
    EmailVerificationCode,
    PasswordResetToken,
    EmailChangeRequest,
    AdminInvitation,
    TwoFactorCode,
)
from apps.accounts.services import email_service


def _hash_value(value: str, salt: str = "") -> str:
    combined = f"{settings.SECRET_KEY}:{salt}:{value}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def generate_numeric_code(length: int = 6) -> str:
    """Generate a secure, unbiased numeric code of given length."""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def blacklist_user_tokens(user: User):
    """Invalidate all outstanding JWT refresh tokens for a specific user."""
    outstanding = OutstandingToken.objects.filter(user=user)
    for token in outstanding:
        BlacklistedToken.objects.get_or_create(token=token)


def register_student(full_name: str, email: str, password: str) -> User:
    email = email.lower().strip()
    if User.objects.filter(email=email).exists():
        raise ValidationError(
            {"email": ["An account with this email address already exists."]}
        )

    try:
        validate_password(password)
    except DjangoValidationError as err:
        raise ValidationError({"password": list(err.messages)})

    user = User.objects.create_user(
        email=email,
        password=password,
        full_name=full_name.strip(),
        is_verified=False,
    )

    # Generate and send email verification code
    code = generate_numeric_code(6)
    code_hash = _hash_value(code, salt=str(user.id))
    EmailVerificationCode.objects.create(
        user=user,
        code_hash=code_hash,
        expires_at=timezone.now() + timedelta(minutes=15),
    )
    email_service.send_verification_email(user.email, code)
    return user


def verify_email(email: str, code: str) -> User:
    email = email.lower().strip()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValidationError({"detail": "Invalid email or verification code."})

    if user.is_verified:
        return user

    latest_code = (
        EmailVerificationCode.objects.filter(user=user, is_used=False)
        .order_by("-created_at")
        .first()
    )

    if not latest_code:
        raise ValidationError(
            {"detail": "No active verification code found. Please request a new one."}
        )

    if latest_code.expires_at < timezone.now():
        raise ValidationError(
            {"detail": "Verification code has expired. Please request a new one."}
        )

    if latest_code.attempts_count >= 5:
        latest_code.is_used = True
        latest_code.save(update_fields=["is_used"])
        raise ValidationError(
            {"detail": "Too many failed attempts. This code is invalidated."}
        )

    expected_hash = _hash_value(code.strip(), salt=str(user.id))
    if latest_code.code_hash != expected_hash:
        latest_code.attempts_count += 1
        latest_code.save(update_fields=["attempts_count"])
        remaining = 5 - latest_code.attempts_count
        raise ValidationError(
            {"detail": f"Invalid code. {remaining} attempt(s) remaining."}
        )

    latest_code.is_used = True
    latest_code.save(update_fields=["is_used"])

    user.is_verified = True
    user.save(update_fields=["is_verified"])
    return user


def resend_verification_code(email: str) -> bool:
    email = email.lower().strip()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return False

    if user.is_verified:
        raise ValidationError(
            {"detail": "This account is already verified. You can log in."}
        )

    # Resend cooldown: 60 seconds
    recent = (
        EmailVerificationCode.objects.filter(user=user).order_by("-created_at").first()
    )
    if recent and (timezone.now() - recent.created_at).total_seconds() < 60:
        remaining = int(60 - (timezone.now() - recent.created_at).total_seconds())
        raise ValidationError(
            {"detail": f"Please wait {remaining} seconds before requesting a new code."}
        )

    # Invalidate previous unused codes
    EmailVerificationCode.objects.filter(user=user, is_used=False).update(is_used=True)

    code = generate_numeric_code(6)
    code_hash = _hash_value(code, salt=str(user.id))
    EmailVerificationCode.objects.create(
        user=user,
        code_hash=code_hash,
        expires_at=timezone.now() + timedelta(minutes=15),
    )
    return email_service.send_verification_email(user.email, code)


def login_user(email: str, password: str) -> dict:
    email = email.lower().strip()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise AuthenticationFailed("Invalid email or password.")

    if not user.check_password(password):
        raise AuthenticationFailed("Invalid email or password.")

    if not user.is_active:
        raise AuthenticationFailed("Account is deactivated. Please contact support.")

    if not user.is_verified:
        raise AuthenticationFailed(
            "Email not verified. Please verify your email before logging in."
        )

    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "is_staff": user.is_staff,
            "is_verified": user.is_verified,
        },
    }


def request_password_reset(email: str) -> bool:
    email = email.lower().strip()
    user = User.objects.filter(email=email).first()
    if not user:
        # Return cleanly to prevent account enumeration
        return True

    # Invalidate previous unused tokens
    PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

    code = generate_numeric_code(6)
    token_hash = _hash_value(code, salt=str(user.id))
    PasswordResetToken.objects.create(
        user=user,
        token_hash=token_hash,
        expires_at=timezone.now() + timedelta(minutes=15),
    )
    return email_service.send_password_reset_email(user.email, code)


def confirm_password_reset(email: str, code: str, new_password: str) -> bool:
    email = email.lower().strip()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValidationError({"detail": "Invalid reset request or code."})

    latest_token = (
        PasswordResetToken.objects.filter(user=user, is_used=False)
        .order_by("-created_at")
        .first()
    )

    if not latest_token:
        raise ValidationError(
            {"detail": "No active reset request found. Please request a new one."}
        )

    if latest_token.expires_at < timezone.now():
        raise ValidationError(
            {"detail": "Reset code has expired. Please request a new one."}
        )

    if latest_token.attempts_count >= 5:
        latest_token.is_used = True
        latest_token.save(update_fields=["is_used"])
        raise ValidationError(
            {"detail": "Too many failed attempts. This code is invalidated."}
        )

    expected_hash = _hash_value(code.strip(), salt=str(user.id))
    if latest_token.token_hash != expected_hash:
        latest_token.attempts_count += 1
        latest_token.save(update_fields=["attempts_count"])
        remaining = 5 - latest_token.attempts_count
        raise ValidationError(
            {"detail": f"Invalid code. {remaining} attempt(s) remaining."}
        )

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as err:
        raise ValidationError({"new_password": list(err.messages)})

    user.set_password(new_password)
    user.save(update_fields=["password"])

    latest_token.is_used = True
    latest_token.save(update_fields=["is_used"])

    # Invalidate all existing sessions
    blacklist_user_tokens(user)
    return True


def change_password(user: User, current_password: str, new_password: str) -> bool:
    if not user.check_password(current_password):
        raise ValidationError(
            {"current_password": ["Current password does not match."]}
        )

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as err:
        raise ValidationError({"new_password": list(err.messages)})

    user.set_password(new_password)
    user.save(update_fields=["password"])
    blacklist_user_tokens(user)
    return True


def request_email_change(user: User, new_email: str, password: str) -> bool:
    new_email = new_email.lower().strip()
    if not user.check_password(password):
        raise ValidationError({"password": ["Incorrect password."]})

    if user.email == new_email:
        raise ValidationError(
            {"new_email": ["New email address is the same as your current email."]}
        )

    if User.objects.filter(email=new_email).exists():
        raise ValidationError(
            {"new_email": ["An account with this email address already exists."]}
        )

    # Invalidate previous unused requests
    EmailChangeRequest.objects.filter(user=user, is_used=False).update(is_used=True)

    code = generate_numeric_code(6)
    code_hash = _hash_value(code, salt=f"{user.id}:{new_email}")
    EmailChangeRequest.objects.create(
        user=user,
        new_email=new_email,
        code_hash=code_hash,
        expires_at=timezone.now() + timedelta(minutes=15),
    )
    return email_service.send_email_change_verification(new_email, code)


def confirm_email_change(user: User, new_email: str, code: str) -> bool:
    new_email = new_email.lower().strip()
    req = (
        EmailChangeRequest.objects.filter(user=user, new_email=new_email, is_used=False)
        .order_by("-created_at")
        .first()
    )
    if not req:
        raise ValidationError({"detail": "No pending email change request found."})

    if req.expires_at < timezone.now():
        raise ValidationError({"detail": "Verification code has expired."})

    if req.attempts_count >= 5:
        req.is_used = True
        req.save(update_fields=["is_used"])
        raise ValidationError({"detail": "Too many failed attempts."})

    expected_hash = _hash_value(code.strip(), salt=f"{user.id}:{new_email}")
    if req.code_hash != expected_hash:
        req.attempts_count += 1
        req.save(update_fields=["attempts_count"])
        remaining = 5 - req.attempts_count
        raise ValidationError(
            {"detail": f"Invalid verification code. {remaining} attempt(s) remaining."}
        )

    if User.objects.filter(email=new_email).exclude(id=user.id).exists():
        raise ValidationError(
            {
                "new_email": [
                    "This email was claimed by another account in the meantime."
                ]
            }
        )

    user.email = new_email
    user.save(update_fields=["email"])

    req.is_used = True
    req.save(update_fields=["is_used"])
    return True


def delete_user_account(user: User, password: str, confirmation: str) -> bool:
    if confirmation.strip() != "DELETE":
        raise ValidationError(
            {"confirmation": ["Confirmation must be exactly 'DELETE'."]}
        )

    if not user.check_password(password):
        raise ValidationError({"password": ["Incorrect password."]})

    # Anonymize or clean up public experiences if any
    user.experiences.filter(status="published").update(is_anonymous=True)

    # Invalidate all tokens and delete user
    blacklist_user_tokens(user)
    user.delete()
    return True


# -------------------------------------------------------------
# Admin Authentication & Invitation Services
# -------------------------------------------------------------


def admin_login(email: str, password: str) -> dict:
    email = email.lower().strip()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise AuthenticationFailed("Invalid admin credentials.")

    if not user.check_password(password):
        raise AuthenticationFailed("Invalid admin credentials.")

    if not user.is_staff:
        raise AuthenticationFailed("Access denied. Administrator privileges required.")

    if not user.is_active:
        raise AuthenticationFailed("Admin account is deactivated.")

    # Mandatory 2FA for admins
    code = generate_numeric_code(6)
    temp_token = secrets.token_urlsafe(32)
    code_hash = _hash_value(code, salt=temp_token)

    TwoFactorCode.objects.create(
        user=user,
        temp_token=temp_token,
        code_hash=code_hash,
        expires_at=timezone.now() + timedelta(minutes=5),
    )
    email_service.send_two_factor_code_email(user.email, code)

    return {
        "status": "2fa_required",
        "temp_token": temp_token,
        "message": f"A 2FA verification code has been sent to {user.email}.",
    }


def verify_admin_2fa(temp_token: str, code: str) -> dict:
    two_factor = (
        TwoFactorCode.objects.filter(temp_token=temp_token, is_used=False)
        .order_by("-created_at")
        .first()
    )
    if not two_factor:
        raise ValidationError({"detail": "Invalid or expired 2FA session."})

    if two_factor.expires_at < timezone.now():
        raise ValidationError({"detail": "2FA code has expired. Please log in again."})

    if two_factor.attempts_count >= 5:
        two_factor.is_used = True
        two_factor.save(update_fields=["is_used"])
        raise ValidationError(
            {"detail": "Too many failed attempts. Session invalidated."}
        )

    expected_hash = _hash_value(code.strip(), salt=temp_token)
    if two_factor.code_hash != expected_hash:
        two_factor.attempts_count += 1
        two_factor.save(update_fields=["attempts_count"])
        remaining = 5 - two_factor.attempts_count
        raise ValidationError(
            {"detail": f"Invalid 2FA code. {remaining} attempt(s) remaining."}
        )

    two_factor.is_used = True
    two_factor.save(update_fields=["is_used"])

    user = two_factor.user
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        },
    }


def invite_admin(invited_by: User, email: str) -> AdminInvitation:
    if not invited_by.is_staff:
        raise ValidationError(
            {"detail": "Only staff administrators can invite new administrators."}
        )

    email = email.lower().strip()
    if User.objects.filter(email=email, is_staff=True).exists():
        raise ValidationError(
            {"email": ["An administrator with this email already exists."]}
        )

    AdminInvitation.objects.filter(email=email, is_accepted=False).delete()

    invite_token = secrets.token_urlsafe(32)
    token_hash = _hash_value(invite_token, salt=email)

    invitation = AdminInvitation.objects.create(
        email=email,
        invited_by=invited_by,
        token_hash=token_hash,
        expires_at=timezone.now() + timedelta(hours=48),
    )
    email_service.send_admin_invitation_email(email, invite_token)
    return invitation


def accept_admin_invitation(invite_token: str, full_name: str, password: str) -> User:
    matched_invitation = None
    for inv in AdminInvitation.objects.filter(is_accepted=False):
        expected = _hash_value(invite_token.strip(), salt=inv.email)
        if inv.token_hash == expected:
            matched_invitation = inv
            break

    if not matched_invitation:
        raise ValidationError({"detail": "Invalid or expired invitation token."})

    if matched_invitation.expires_at < timezone.now():
        raise ValidationError(
            {"detail": "Invitation has expired. Please request a new invitation."}
        )

    try:
        validate_password(password)
    except DjangoValidationError as err:
        raise ValidationError({"password": list(err.messages)})

    user, created = User.objects.get_or_create(
        email=matched_invitation.email,
        defaults={
            "full_name": full_name.strip(),
            "is_staff": True,
            "is_superuser": False,
            "is_verified": True,
            "is_admin_2fa_enabled": True,
        },
    )
    if not created:
        user.full_name = full_name.strip()
        user.is_staff = True
        user.is_verified = True
        user.is_admin_2fa_enabled = True
    user.set_password(password)
    user.save()

    matched_invitation.is_accepted = True
    matched_invitation.save(update_fields=["is_accepted"])
    return user
