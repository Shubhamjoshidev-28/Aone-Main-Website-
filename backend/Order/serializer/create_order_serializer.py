from rest_framework import (
    serializers
)
from Order.models.order import (
    Order
)
from Order.serializer.order_items_serializer import (
    OrderItemSerializer
)

class CreateOrderSerializer (
    serializers.ModelSerializer
):
    items = OrderItemSerializer(
        many=True
    )
    class Meta:
        model = Order
        fields = [
            'id',
            'Cust_Name',
            'Phone',
            'Table_No',
            'Car_No',
            'Staff_Assigned',
            'items',
            'Total',
            'Source',
            'Payment_Status',
            'Status',
            'Payment_Type',
            'created_at'
        ]
