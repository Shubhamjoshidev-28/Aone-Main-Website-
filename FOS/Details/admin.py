from django.contrib import admin
from Details.models.details import (
    Details
)

@admin.register(Details)
class AdminDetails(
    admin.ModelAdmin
):
    model = Details
    list_display = [
        "id",
        "Name",
        "Phone",
        "Role",
        "is_active",
        "created_at"
    ]
    search_fields = [
        "Name",
        "Phone",
        "Role"
    ]
