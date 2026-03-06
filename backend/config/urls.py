from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/", include("apps.core.urls")),
    path("api/", include("apps.venues.urls")),
    path("api/", include("apps.reviews.urls")),
    path("api/", include("apps.playlists.urls")),
    path("api/", include("apps.feed.urls")),
    path("api/", include("apps.search.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/gamification/", include("apps.gamification.urls")),
    path("api/", include("apps.sharing.urls")),
    path("api/ml/", include("apps.ml.urls")),
    path("api/groups/", include("apps.groups.urls")),
    path("api/rankings/", include("apps.rankings.urls")),
]
