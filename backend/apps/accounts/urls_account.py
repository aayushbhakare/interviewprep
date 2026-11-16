from django.urls import path

from apps.accounts.views_account import (
    ProfileView,
    ChangePasswordView,
    EmailChangeRequestView,
    EmailChangeConfirmView,
    AccountDeleteView,
)

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='account-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='account-change-password'),
    path('change-email/request/', EmailChangeRequestView.as_view(), name='account-change-email-request'),
    path('change-email/confirm/', EmailChangeConfirmView.as_view(), name='account-change-email-confirm'),
    path('delete/', AccountDeleteView.as_view(), name='account-delete'),
]
