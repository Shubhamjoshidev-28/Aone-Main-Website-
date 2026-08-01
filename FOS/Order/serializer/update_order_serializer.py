from rest_framework import serializers

from Order.models.order import Order
from Order.serializer.order_items_serializer import OrderItemSerializer


class UpdateOrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(
        many=True,
        required=False
    )

    class Meta:
        model = Order
        fields = [
            "Cust_Name",
            "Table_No",
            "Car_No",
            "Staff_Assigned",
            "Source",
            "Payment_Status",
            "Status",
            "Payment_Type",
            "items"
        ]