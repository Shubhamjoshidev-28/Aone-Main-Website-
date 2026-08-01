from django.db.models import (
    Sum,
    Count
)

from Order.models.order import (
    Order
)

from Order.models.order_items import (
    Order_Items
)


def get_orders_between_dates(
    start_date,
    end_date
):
    return Order.objects.filter(
        created_at__date__range=[
            start_date,
            end_date
        ]
    )


def get_total_orders_between_dates(
    start_date,
    end_date
):
    orders = get_orders_between_dates(
        start_date,
        end_date
    )

    return orders.count()


def get_revenue_between_dates(
    start_date,
    end_date
):
    orders = get_orders_between_dates(
        start_date,
        end_date
    )

    return orders.aggregate(
        revenue=Sum("Total")
    )["revenue"] or 0


def get_order_items_between_dates(
    start_date,
    end_date
):
    return Order_Items.objects.filter(
        order__created_at__date__range=[
            start_date,
            end_date
        ]
    )


def get_best_seller_between_dates(
    start_date,
    end_date
):
    return (
        get_order_items_between_dates(
            start_date,
            end_date
        )
        .values(
            "item",
            "item__Item_Name"
        )
        .annotate(
            total_qty=Sum("order_qty")
        )
        .order_by(
            "-total_qty"
        )
        .first()
    )


def get_top_five_best_sellers_between_dates(
    start_date,
    end_date
):
    return (
        get_order_items_between_dates(
            start_date,
            end_date
        )
        .values(
            "item",
            "item__ItemName"
        )
        .annotate(
            total_qty=Sum("order_qty")
        )
        .order_by(
            "-total_qty"
        )[:5]
    )


def get_best_order_handler_between_dates(
    start_date,
    end_date
):
    return (
        get_orders_between_dates(
            start_date,
            end_date
        )
        .exclude(
            Staff_Assigned=None
        )
        .values(
            "Staff_Assigned",
            "Staff_Assigned__Name"
        )
        .annotate(
            total_orders=Count("id"),
            total_revenue=Sum("Total")
        )
        .order_by(
            "-total_orders"
        )
        .first()
    )