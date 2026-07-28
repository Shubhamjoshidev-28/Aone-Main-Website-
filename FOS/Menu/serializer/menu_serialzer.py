from rest_framework import (
    serializers
)
from Menu.models.menu import (
    Menu
)

class MenuSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Menu,
        fields = [
            'id',
            'Item_Name',
            'Item_Category',
            'Item_Size',
            'Item_Price',
            'is_available'
            'created_at'
        ]

