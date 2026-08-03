from django.db.models import (
    Sum,
    Count,
    F,
    DecimalField,
    ExpressionWrapper
)

from django.db.models.functions import (
    TruncDate
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
    return get_orders_between_dates(
        start_date,
        end_date
    ).count()


def get_revenue_between_dates(
    start_date,
    end_date
):
    return (
        get_orders_between_dates(
            start_date,
            end_date
        )
        .aggregate(
            revenue=Sum("Total")
        )["revenue"] or 0
    )


def get_revenue_per_day_between_dates(
    start_date,
    end_date
):
    return (
        get_orders_between_dates(
            start_date,
            end_date
        )
        .annotate(
            day=TruncDate("created_at")
        )
        .values("day")
        .annotate(
            revenue=Sum("Total")
        )
        .order_by("day")
    )


def get_orders_per_day_between_dates(
    start_date,
    end_date
):
    return (
        get_orders_between_dates(
            start_date,
            end_date
        )
        .annotate(
            day=TruncDate("created_at")
        )
        .values("day")
        .annotate(
            total_orders=Count("id")
        )
        .order_by("day")
    )


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


def get_total_units_sold_between_dates(
    start_date,
    end_date
):
    return (
        get_order_items_between_dates(
            start_date,
            end_date
        )
        .aggregate(
            total_units=Sum("order_qty")
        )["total_units"] or 0
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
            item_name=F("item__Item_Name")
        )
        .annotate(
            units_sold=Sum("order_qty")
        )
        .order_by(
            "-units_sold"
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
            item_name=F("item__Item_Name")
        )
        .annotate(
            units_sold=Sum("order_qty")
        )
        .order_by(
            "-units_sold"
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
            staff_name=F("Staff_Assigned__Name")
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


def get_revenue_distribution_between_dates(
    start_date,
    end_date
):
    return (
        get_order_items_between_dates(
            start_date,
            end_date
        )
        .annotate(
            item_revenue=ExpressionWrapper(
                F("unit_price") * F("order_qty"),
                output_field=DecimalField(
                    max_digits=12,
                    decimal_places=2
                )
            )
        )
        .values(
            "item",
            item_name=F("item__Item_Name")
        )
        .annotate(
            revenue=Sum("item_revenue")
        )
        .order_by(
            "-revenue"
        )
    )