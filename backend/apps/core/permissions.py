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
