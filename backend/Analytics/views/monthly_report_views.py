from django.shortcuts import render
from rest_framework.views import APIView

from Analytics.services.monthly_report_services import (
    MonthlyReportService
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


class MonthlyReportView(APIView):

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

        context = MonthlyReportService.generate_monthly_report()

        return render(
            request,
            "monthly_report.html",
            context
        )