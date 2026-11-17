from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.accounts.models import User, AdminInvitation
from apps.administration.permissions import IsPlatformAdmin
from apps.administration.services.activity_log_service import log_admin_activity


class AdminAccountListView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="List Administrator Accounts",
        description="Inspect registered platform administrators, their active status, and 2FA compliance.",
        responses={200: dict},
    )
    def get(self, request):
        admins = User.objects.filter(is_staff=True).order_by("-created_at")
        results = [
            {
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "is_admin_2fa_enabled": u.is_admin_2fa_enabled,
                "is_superuser": u.is_superuser,
                "created_at": u.created_at,
                "last_login": u.last_login,
            }
            for u in admins
        ]
        return Response({"status": "success", "data": results})


class AdminAccountDeactivateView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Deactivate Administrator Account",
        description="Deactivates an administrator account. Prevents lockouts by ensuring at least one active administrator remains.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, admin_id):
        target_admin = get_object_or_404(User, id=admin_id, is_staff=True)

        active_admin_count = User.objects.filter(is_staff=True, is_active=True).count()
        if active_admin_count <= 1 and target_admin.is_active:
            return Response(
                {"detail": "Cannot deactivate the last active platform administrator."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_admin.is_active = False
        target_admin.save(update_fields=["is_active"])

        log_admin_activity(
            actor=request.user,
            action="admin_deactivated",
            resource_type="admin_user",
            resource_id=str(target_admin.id),
            details={"email": target_admin.email},
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"Administrator {target_admin.email} deactivated successfully.",
                "data": {"id": str(target_admin.id), "is_active": False},
            }
        )


class AdminAccountReactivateView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Reactivate Administrator Account",
        description="Restores active administrator status.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, admin_id):
        target_admin = get_object_or_404(User, id=admin_id, is_staff=True)

        target_admin.is_active = True
        target_admin.save(update_fields=["is_active"])

        log_admin_activity(
            actor=request.user,
            action="admin_reactivated",
            resource_type="admin_user",
            resource_id=str(target_admin.id),
            details={"email": target_admin.email},
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"Administrator {target_admin.email} reactivated successfully.",
                "data": {"id": str(target_admin.id), "is_active": True},
            }
        )


class AdminInvitationListView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="List Administrator Invitations",
        description="Inspect sent administrator invitations, acceptance status, and revocation status.",
        responses={200: dict},
    )
    def get(self, request):
        invitations = AdminInvitation.objects.select_related("invited_by").order_by("-created_at")
        results = [
            {
                "id": str(inv.id),
                "email": inv.email,
                "invited_by": inv.invited_by.email if inv.invited_by else "System",
                "is_accepted": inv.is_accepted,
                "is_revoked": getattr(inv, "is_revoked", False),
                "expires_at": inv.expires_at,
                "created_at": inv.created_at,
            }
            for inv in invitations
        ]
        return Response({"status": "success", "data": results})


class AdminInvitationRevokeView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Revoke Administrator Invitation",
        description="Revokes an unused administrator invitation, invalidating the onboarding token.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, invitation_id):
        invitation = get_object_or_404(AdminInvitation, id=invitation_id)

        if invitation.is_accepted:
            return Response(
                {"detail": "Cannot revoke an invitation that has already been accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation.is_revoked = True
        invitation.save(update_fields=["is_revoked"])

        log_admin_activity(
            actor=request.user,
            action="admin_invitation_revoked",
            resource_type="admin_invitation",
            resource_id=str(invitation.id),
            details={"email": invitation.email},
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"Invitation for {invitation.email} has been revoked.",
                "data": {"id": str(invitation.id), "is_revoked": True},
            }
        )
