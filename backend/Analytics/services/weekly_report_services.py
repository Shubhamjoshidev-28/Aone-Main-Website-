from datetime import timedelta
from django.utils import timezone

from Analytics.selectors.analytics_selector import (
    get_total_orders_between_dates,
    get_revenue_between_dates,
    get_revenue_per_day_between_dates,
    get_best_seller_between_dates,
    get_top_five_best_sellers_between_dates,
    get_best_order_handler_between_dates,
    get_revenue_distribution_between_dates,
)


class WeeklyReportService:

    @staticmethod
    def _week_range():

        today = timezone.localdate()

        start_date = today - timedelta(days=6)

        end_date = today

        return start_date, end_date


    @staticmethod
    def generate_weekly_report():

        start_date, end_date = WeeklyReportService._week_range()

        total_orders = get_total_orders_between_dates(
            start_date,
            end_date
        )

        total_revenue = get_revenue_between_dates(
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

        top_five = get_top_five_best_sellers_between_dates(
            start_date,
            end_date
        )

        best_handler = get_best_order_handler_between_dates(
            start_date,
            end_date
        )

        revenue_per_day = get_revenue_per_day_between_dates(
            start_date,
            end_date
        )

        revenue_distribution = get_revenue_distribution_between_dates(
            start_date,
            end_date
        )

        return {

            "report":{

                "start_date":start_date,

                "end_date":end_date,

                "generated_at":timezone.now()

            },

            "summary":{

                "total_orders":total_orders,

                "total_revenue":total_revenue,

                "average_order_value":average_order_value,

                "best_seller":best_seller,

                "best_order_handler":best_handler

            },

            "charts":{

                "revenue_per_day":list(revenue_per_day),

                "revenue_distribution":list(revenue_distribution),

                "top_five":list(top_five)

            },

            "tables":{

                "top_five":top_five,

                "daily_revenue":revenue_per_day

            }

        }