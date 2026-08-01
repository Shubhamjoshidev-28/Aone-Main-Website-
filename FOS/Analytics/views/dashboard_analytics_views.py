from rest_framework.views import (
    APIView
)
from rest_framework.response import (
    Response
)
from rest_framework import (
    status
)
from Analytics.services.dashboard_services import (
    DashboardServices
)

class DashboardAnalyticsView(APIView):

    def get(
        self,
        request
    ):

        dashboard = DashboardServices.daily_analytics()

        return Response(
            {
                "success": True,
                "message": "Dashboard Analytics",
                "dashboard": dashboard
            },
            status=status.HTTP_200_OK
        )
