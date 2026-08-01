from Analytics.selectors.analytics_selector import (
    get_total_orders_between_dates,
    get_top_five_best_sellers_between_dates,
    get_best_order_handler_between_dates,
    get_best_seller_between_dates,
    get_order_items_between_dates,
    get_orders_between_dates,
    get_revenue_between_dates
)
from datetime import date

class DashboardServices:

    @staticmethod
    def daily_analytics():
        today = date.today()

        revenue = get_revenue_between_dates(
            start_date=today,
            end_date=today
        )

        total_orders = get_total_orders_between_dates(
            start_date=today,
            end_date=today
        )

        best_seller = get_best_seller_between_dates(
            start_date=today,
            end_date=today
        )

        best_order_handler = get_best_order_handler_between_dates(
            start_date=today,
            end_date=today
        )

        return {
            "today_revenue": revenue,
            "today_orders": total_orders,
            "best_seller": best_seller,
            "best_order_handler": best_order_handler,
        }