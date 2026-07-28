from django.contrib import admin
from Order.models.order import (
    Order
)
from Order.models.order_items import (
    Order_Items
)

@admin.register(Order_Items)
class Order_Items_Admin(
    admin.ModelAdmin
):
    model = Order_Items
    list_display = [
        "id",
        "order_id",
        "item_id",
        "unit_price",
        "order_qty",
        "created_at"
    ]
    search_fields = [
        "order_id"
    ]

@admin.register(Order)
class OrderAdmin(
    admin.ModelAdmin
):
    model = Order
    list_display = [
        "id",
        "Cust_Name",
        "Table_No",
        "Car_No",
        "Staff_Assigned",
        "Total",
        "Source",
        "Payment_Status",
        "Status",
        "Payment_Type",
        "created_at"
    ]
    search_fields = [
        "Cust_Name",
        "Table_No",
        "Car_No",
        "Staff_Assigned",
        "Payment_Status",
        "Payment_Type"
        "Status"
    ]
