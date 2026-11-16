import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

# Registry storing recent codes in memory for local testing / test verification
LATEST_SENT_CODES = {}


def _record_local_code(category: str, identifier: str, code: str):
    key = f"{category}:{identifier.lower()}"
    LATEST_SENT_CODES[key] = code
    logger.info(f"[EMAIL SERVICE - LOCAL LOG] {category} for {identifier}: {code}")


def get_latest_code(category: str, identifier: str) -> str | None:
    return LATEST_SENT_CODES.get(f"{category}:{identifier.lower()}")


def send_verification_email(email: str, code: str) -> bool:
    _record_local_code("verification", email, code)
    subject = "Your Verification Code — Interview Preparation Platform"
    message = (
        f"Welcome to Interview Preparation Platform!\n\n"
        f"Your one-time verification code is:\n\n"
        f"    {code}\n\n"
        f"This code will expire in 15 minutes.\n"
        f"If you did not create an account, please disregard this email."
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.warning(f"Failed to send email to {email}: {e}")
        return False


def send_password_reset_email(email: str, code: str) -> bool:
    _record_local_code("password_reset", email, code)
    subject = "Password Reset Code — Interview Preparation Platform"
    message = (
        f"You requested to reset your password.\n\n"
        f"Your verification code is:\n\n"
        f"    {code}\n\n"
        f"This code will expire in 15 minutes.\n"
        f"If you did not request a password reset, your account remains secure."
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.warning(f"Failed to send password reset email to {email}: {e}")
        return False


def send_email_change_verification(new_email: str, code: str) -> bool:
    _record_local_code("email_change", new_email, code)
    subject = "Verify Your New Email Address — Interview Preparation Platform"
    message = (
        f"You requested to update your email address.\n\n"
        f"Your verification code is:\n\n"
        f"    {code}\n\n"
        f"This code will expire in 15 minutes.\n"
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[new_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.warning(f"Failed to send email change verification to {new_email}: {e}")
        return False


def send_admin_invitation_email(email: str, invite_token: str) -> bool:
    _record_local_code("admin_invitation", email, invite_token)
    subject = "You are invited as an Administrator — Interview Preparation Platform"
    message = (
        f"You have been invited to join the Interview Preparation Platform as an Administrator.\n\n"
        f"Your invitation security token is:\n\n"
        f"    {invite_token}\n\n"
        f"This invitation will expire in 48 hours.\n"
        f"Please accept your invitation through the administrator onboarding portal."
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.warning(f"Failed to send admin invitation email to {email}: {e}")
        return False


def send_two_factor_code_email(email: str, code: str) -> bool:
    _record_local_code("two_factor", email, code)
    subject = "Admin Two-Factor Security Code — Interview Preparation Platform"
    message = (
        f"A login attempt was made to your Administrator account.\n\n"
        f"Your two-factor verification code is:\n\n"
        f"    {code}\n\n"
        f"This code will expire in 5 minutes.\n"
        f"If this was not you, please secure your account immediately."
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.warning(f"Failed to send 2FA email to {email}: {e}")
        return False
