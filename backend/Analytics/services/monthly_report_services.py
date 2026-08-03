from calendar import monthrange

from django.utils import timezone

from Analytics.selectors.analytics_selector import (
    get_total_orders_between_dates,
    get_revenue_between_dates,
    get_orders_per_day_between_dates,
    get_revenue_per_day_between_dates,
    get_total_units_sold_between_dates,
    get_best_seller_between_dates,
    get_top_five_best_sellers_between_dates,
    get_best_order_handler_between_dates,
    get_revenue_distribution_between_dates,
)


class MonthlyReportService:

    @staticmethod
    def generate_monthly_report():

        today = timezone.localdate()

        start_date = today.replace(
            day=1
        )

        last_day = monthrange(
            today.year,
            today.month
        )[1]

        end_date = today.replace(
            day=last_day
        )

        total_orders = get_total_orders_between_dates(
            start_date,
            end_date
        )

        total_revenue = get_revenue_between_dates(
            start_date,
            end_date
        )

        total_units_sold = get_total_units_sold_between_dates(
            start_date,
            end_date
        )

        average_order_value = 0

        if total_orders:
            average_order_value = round(
                total_revenue / total_orders,
                2
            )

        best_seller = get_best_seller_between_dates(
            start_date,
            end_date
        )

        top_five_best_sellers = list(
            get_top_five_best_sellers_between_dates(
                start_date,
                end_date
            )
        )

        best_order_handler = get_best_order_handler_between_dates(
            start_date,
            end_date
        )

        revenue_per_day = list(
            get_revenue_per_day_between_dates(
                start_date,
                end_date
            )
        )

        orders_per_day = list(
            get_orders_per_day_between_dates(
                start_date,
                end_date
            )
        )

        revenue_distribution = list(
            get_revenue_distribution_between_dates(
                start_date,
                end_date
            )
        )

        return {

            "report": {

                "title": "Monthly Report",

                "start_date": start_date,

                "end_date": end_date,

                "generated_at": timezone.now()

            },

            "summary": {

                "total_orders": total_orders,

                "total_revenue": total_revenue,

                "average_order_value": average_order_value,

                "total_units_sold": total_units_sold,

                "best_seller": best_seller,

                "best_order_handler": best_order_handler

            },

            "charts": {

                "revenue_per_day": revenue_per_day,

                "orders_per_day": orders_per_day,

                "revenue_distribution": revenue_distribution,

                "top_five_best_sellers": top_five_best_sellers

            },

            "tables": {

                "daily_revenue": revenue_per_day,

                "daily_orders": orders_per_day,

                "top_five_best_sellers": top_five_best_sellers

            }

        }