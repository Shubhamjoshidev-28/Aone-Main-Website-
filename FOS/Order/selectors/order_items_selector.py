from Order.models.order_items import (
    Order_Items
)

def get_order_item_by_order_id(
        order_id
):
    
    order_items= Order_Items.objects.filter(
        order_id=order_id
    )

    return order_items