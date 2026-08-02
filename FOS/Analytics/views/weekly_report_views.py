from django.shortcuts import render
from rest_framework.views import APIView

from Analytics.services.weekly_report_services import (
    WeeklyReportService
)
from Accounts.permissions.owner_permission import (
    IsOwner
)
from rest_framework.permissions import (
    IsAuthenticated
)
from rest_framework_simplejwt.authentication import (
    JWTAuthentication
)


class WeeklyReportView(APIView):

    permission_classes = [
        IsOwner,
        IsAuthenticated
    ]
    authentication_classes = [
        JWTAuthentication
    ]

    def get(
        self,
        request
    ):

        context = WeeklyReportService.generate_weekly_report()

        return render(
            request,
            "weekly_report.html",
            context
        )