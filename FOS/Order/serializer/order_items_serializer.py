from rest_framework import (
    serializers
)
from Order.models.order_items import (
    Order_Items
)

class OrderItemSerializer(
    serializers
):
    class Meta:
        model = Order_Items
        fields = [
            'id',
            'item_id',
            'unit_price',
            'order_qty'
        ]