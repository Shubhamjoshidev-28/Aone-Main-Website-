from rest_framework import (
    serializers
)
from Order.models.order_items import (
    Order_Items
)

class OrderItemSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Order_Items
        fields = [
            'id',
            'item',
            'unit_price',
            'order_qty'
        ]