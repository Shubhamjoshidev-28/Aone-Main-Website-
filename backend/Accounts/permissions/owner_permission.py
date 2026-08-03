from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):

    message = "Only owners are allowed to access this resource."

    def has_permission(
        self,
        request,
        view
    ):

        if not request.user.is_authenticated:
            return False

        return (
            request.user.Role == "Owner"
            and request.user.is_active
        )