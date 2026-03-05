from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    """Allow owners to edit, everyone else can only read."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, "user", None)
        return owner == request.user


class IsOwner(BasePermission):
    """Only the owner can access this object."""

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", None)
        return owner == request.user


class ReadPublicWriteAuthenticated(BasePermission):
    """
    Allow anyone to read (GET, HEAD, OPTIONS), but require authentication for writes.
    Used for content-first onboarding: anonymous users can browse, auth required to interact.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated


class CanViewPlaylist(BasePermission):
    """
    Permission to view a playlist based on its visibility setting.
    - Public: Anyone can view
    - Private: Only owner can view
    - Followers: Owner and followers of owner can view
    """

    def has_object_permission(self, request, view, obj):
        from apps.users.models import Follow

        # Owner can always view
        if obj.user == request.user:
            return True

        # Public playlists are visible to all
        if obj.visibility == 'public':
            return True

        # Private playlists only visible to owner (already checked above)
        if obj.visibility == 'private':
            return False

        # Followers-only: check if requester follows the owner
        if obj.visibility == 'followers':
            if not request.user or not request.user.is_authenticated:
                return False
            return Follow.objects.filter(
                follower=request.user, following=obj.user
            ).exists()

        return False
