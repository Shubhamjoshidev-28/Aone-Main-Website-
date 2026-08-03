from rest_framework import serializers

from Order.models.order import Order
from Order.serializer.order_items_serializer import OrderItemSerializer


class OrderDetailSerializer(serializers.ModelSerializer):

    order_items = OrderItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Order
        fields = "__all__"