from Order.selectors.order_selector import (
    get_order_by_id,
)
from Order.selectors.order_items_selector import (
    get_order_item_by_order_id
)


class InvoiceService:
   

    @staticmethod
    def generate_bill(order_id):

        order = get_order_by_id(order_id)
        order_items = get_order_item_by_order_id(
            order_id
        )
        items = []

        for item in order_items:
            items.append(
                {
                    "item_name": item.item.Item_Name,
                    "quantity": item.order_qty,
                    "unit_price": item.unit_price,
                    "subtotal": item.unit_price * item.order_qty
                }
            )

        invoice = {

            "invoice_number": f"INV-{order.id:05d}",
        
            "restaurant": {
                "name": "AOne Chicken",
                "address": "Rajpura",
                "phone": "+91XXXXXXXXXX"
            },
        
            "customer": {
                "name": order.Cust_Name,
                "car_number": order.Car_No,
                "table_number": order.Table_No,
            },
        
            "items": items,
        
            "subtotal": order.Total,
        
            "discount": 0,
        
            "gst": 0,
        
            "grand_total": order.Total,
        
            "order": {
                "status": order.Status,
                "staff": order.Staff_Assigned.Name if order.Staff_Assigned else None,
                "payment_status": order.Payment_Status,
                "payment_type": order.Payment_Type,
                "source": order.Source,
                "created_at": order.created_at,
            }
        }        
        return invoice