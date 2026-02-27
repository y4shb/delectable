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
