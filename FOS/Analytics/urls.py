from django.urls import (
    path
)
from Analytics.views.dashboard_analytics_views import (
    DashboardAnalyticsView
)

urlpatterns = [
    path('daily_analytics/',DashboardAnalyticsView.as_view(),name='daily_analytics'),
]