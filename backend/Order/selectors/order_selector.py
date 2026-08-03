from Order.models.order import (
    Order
)
from Order.models.order_items import (
    Order_Items
)

def get_order_by_id(
    order_id 
):
    order = Order.objects.filter(id=order_id).first()
    return order

def get_order(
        
):
    return Order.objects.all()
    