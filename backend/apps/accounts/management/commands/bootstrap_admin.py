from django.core.management.base import BaseCommand
from django.contrib.auth.password_validation import validate_password
from apps.accounts.models import User


class Command(BaseCommand):
    help = "Securely bootstrap the initial system administrator account."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            type=str,
            default="admin@interviewprep.local",
            help="Administrator email address",
        )
        parser.add_argument(
            "--name",
            type=str,
            default="System Administrator",
            help="Administrator full name",
        )
        parser.add_argument(
            "--password",
            type=str,
            default="AdminSecretPassword123!",
            help="Administrator secure password",
        )

    def handle(self, *args, **options):
        email = options["email"].lower().strip()
        name = options["name"].strip()
        password = options["password"]

        validate_password(password)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": name,
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
                "is_admin_2fa_enabled": True,
            },
        )

        user.full_name = name
        user.is_staff = True
        user.is_superuser = True
        user.is_verified = True
        user.is_admin_2fa_enabled = True
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully {action} Initial Administrator:\n"
                f"  Email: {user.email}\n"
                f"  Name:  {user.full_name}\n"
                f"  Staff: {user.is_staff} | 2FA: {user.is_admin_2fa_enabled}"
            )
        )
