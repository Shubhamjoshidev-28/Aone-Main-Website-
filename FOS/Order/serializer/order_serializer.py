from rest_framework import (
    serializers
)
from Order.models.order import (
    Order
)

class OrderSerializer (
    serializers.ModelSerializer
):
    class Meta:
        model = Order
        fields = [
            'id',
            'Cust_Name',
            'Table_No',
            'Car_No',
            'Staff_Assigned',
            'Total',
            'Source',
            'Payment_Status',
            'Status',
            'Payment_Type',
            'created_at'
        ]
