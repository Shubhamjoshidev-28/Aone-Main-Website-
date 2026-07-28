from django.db import (
    models
)
from Menu.models.menu import (
    Menu
)
from Order.models.order import (
    Order
)
from django.core.validators import (
    MinValueValidator
)
from decimal import (
    Decimal
)


class Order_Items(
    models.Model
):

    id = models.BigAutoField(
        primary_key=True
    )
    order_id = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='Order_Items'
    )
    item_id = models.ForeignKey(
        Menu,
        on_delete=models.SET_NULL,
        related_name='Order_Items',
        null=True,
        blank=True
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))]
    )
    order_qty = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )