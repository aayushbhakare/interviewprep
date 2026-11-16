from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # OpenAPI Schema & Interactive Docs
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"
    ),
    # API v1 Domain Routes
    path("api/v1/", include("apps.common.urls")),
    path("api/v1/auth/", include("apps.accounts.urls_auth")),
    path("api/v1/account/", include("apps.accounts.urls_account")),
    path("api/v1/learning/", include("apps.learning.urls")),
    path("api/v1/quizzes/", include("apps.quizzes.urls")),
    path("api/v1/aptitude/", include("apps.aptitude.urls")),
    path("api/v1/interviews/", include("apps.interviews.urls")),
    path("api/v1/experiences/", include("apps.experiences.urls")),
    path("api/v1/admin-panel/", include("apps.administration.urls")),
]
