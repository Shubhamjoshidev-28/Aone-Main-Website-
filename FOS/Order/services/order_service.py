from Order.selectors.order_selector import (
    get_order,
    get_order_by_id
)
from Order.models.order import (
    Order
)
from Order.models.order_items import (
    Order_Items
)
from django.db import (
    transaction
)

from Order.selectors.order_items_selector import (
    get_order_item_by_order_id
)
from decimal import (
   Decimal
)
from rest_framework.response import (
    Response
)

class OrderService:

    @staticmethod
    def order_total(
        order_id
    ):
        order_items = get_order_item_by_order_id(order_id)

        total = Decimal("0.00")

        for item in order_items:
            total += item.unit_price * item.order_qty

        return total
        

    @staticmethod
    @transaction.atomic
    def create_order(validated_data):

        items = validated_data.pop("items")

        order = Order.objects.create(
            Cust_Name=validated_data.get("Cust_Name"),
            Table_No=validated_data.get("Table_No"),
            Car_No=validated_data.get("Car_No"),
            Staff_Assigned=validated_data.get("Staff_Assigned"),
            Total=Decimal("0.00"),
            Source=validated_data["Source"],
            Payment_Status=validated_data.get("Payment_Status"),
            Status=validated_data["Status"],
            Payment_Type=validated_data.get("Payment_Type"),
        )

        for item in items:

            menu = item["item"]

            qty = item["quantity"]

            Order_Items.objects.create(
                order_id=order,
                item_id=menu,
                unit_price=menu.Item_Price,
                order_qty=qty
            )

        order.Total = OrderService.order_total(order.id)

        order.save(update_fields=["Total"])

        return order

    @staticmethod
    @transaction.atomic
    def update_order(
        order_id,
        validated_data
    ):
    
        order = get_order_by_id(order_id)
    
        items = validated_data.pop("items")
    
        order.Cust_Name = validated_data.get(
            "Cust_Name",
            order.Cust_Name
        )
    
        order.Table_No = validated_data.get(
            "Table_No",
            order.Table_No
        )
    
        order.Car_No = validated_data.get(
            "Car_No",
            order.Car_No
        )
    
        order.Staff_Assigned = validated_data.get(
            "Staff_Assigned",
            order.Staff_Assigned
        )
    
        order.Source = validated_data.get(
            "Source",
            order.Source
        )
    
        order.Payment_Status = validated_data.get(
            "Payment_Status",
            order.Payment_Status
        )
    
        order.Status = validated_data.get(
            "Status",
            order.Status
        )
    
        order.Payment_Type = validated_data.get(
            "Payment_Type",
            order.Payment_Type
        )
    
        Order_Items.objects.filter(
            order_id=order
        ).delete()
    
        for item in items:
    
            menu = item["item"]
    
            qty = item["quantity"]
    
            Order_Items.objects.create(
                order_id=order,
                item_id=menu,
                unit_price=menu.Item_Price,
                order_qty=qty
            )
    
        order.Total = OrderService.order_total(order.id)
    
        order.save()
    
        return order

    @staticmethod
    def delete_order(
        order_id
    ):
        order = get_order_by_id(
            order_id
        )
        order.delete()

        return ("Order Deleted Successfully")

    @staticmethod
    def order_list(

    ):
        order=get_order()
        return order

    @staticmethod
    def order_details(
        order_id
    ):
        order= get_order_by_id(
            order_id
        )
        order_items = get_order_item_by_order_id(
            order_id
        )

        return (
            {
                "id":order.id,
                "Cust_Name":order.Cust_Name,
                "Table_No":order.Table_No,
                "Car_No":order.Car_No,
                "Staff_Assigned":order.Staff_Assigned,
                "Total":order.Total,
                "order_items":order_items.item,
                "Source":order.Source,
                "Status":order.status,
                "Payment_Status":order.Payment_Status,
                "Payment_Type":order.Payment_Type,
                "created_at":order.created_at
            }
        )
    