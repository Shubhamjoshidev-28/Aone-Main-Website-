from django.contrib import admin
from Accounts.models.accounts import (
    Account
)

@admin.register(Account)
class AccountAdmin(
    admin.ModelAdmin
):
    model = Account
    list_display=[
        "id",
        "username",
        "password",
        "Name",
        "Phone_No",
        "Role",
        "created_at",
        "updated_at"
    ]

    
