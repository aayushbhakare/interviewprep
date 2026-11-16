from django.core.management.base import BaseCommand
from apps.accounts.models import User, UserProfile


class Command(BaseCommand):
    help = "Create or reset a verified student user for end-to-end testing."

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, default="e2e_student@interviewprep.local")
        parser.add_argument("--name", type=str, default="E2E Student")
        parser.add_argument("--password", type=str, default="E2EPassword123!")

    def handle(self, *args, **options):
        email = options["email"].lower().strip()
        name = options["name"]
        password = options["password"]

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"full_name": name, "is_verified": True},
        )
        user.set_password(password)
        user.full_name = name
        user.is_verified = True
        user.is_active = True
        user.save()
        UserProfile.objects.get_or_create(user=user)

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} verified student: {email}"))
