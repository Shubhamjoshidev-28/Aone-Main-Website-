from django.contrib import admin
from Menu.models.menu import (
    Menu
)

@admin.register(Menu)
class MenuAdmin(
    admin.ModelAdmin
):
    model = Menu
    list_display = [
        "id",
        "Item_Name",
        "Item_Category",
        "Item_Size",
        "Item_Price",
        "is_available",
        "created_at",
    ]
    search_fields=[
        "Item_Name",
        "Item_Category"
    ]
    
