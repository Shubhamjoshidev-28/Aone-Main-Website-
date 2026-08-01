from django.shortcuts import render
from rest_framework.views import APIView

from Analytics.services.monthly_report_services import (
    MonthlyReportService
)


class MonthlyReportView(APIView):

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