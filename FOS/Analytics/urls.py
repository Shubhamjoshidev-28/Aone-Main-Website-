from django.urls import (
    path
)
from Analytics.views.dashboard_analytics_views import (
    DashboardAnalyticsView
)
from Analytics.views.weekly_report_views import (
    WeeklyReportView
)
from Analytics.views.monthly_report_views import  (
    MonthlyReportView
)

urlpatterns = [
    path('daily_analytics/',DashboardAnalyticsView.as_view(),name='daily_analytics'),
    path('weekly_report/', WeeklyReportView.as_view(),name='weekly_report'),
    path('monthly_report/',MonthlyReportView.as_view(),name='monthly_report')
]