from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    """
    Allows access only to authenticated staff users who are not suspended.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_staff
            and user.is_active
            and not getattr(user, "is_suspended", False)
        )


class IsNotSuspended(BasePermission):
    """
    Prevents suspended student users from accessing protected APIs.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return True
        return not getattr(user, "is_suspended", False)
