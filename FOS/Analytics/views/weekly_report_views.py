from django.shortcuts import render
from rest_framework.views import APIView

from Analytics.services.weekly_report_services import (
    WeeklyReportService
)


class WeeklyReportView(APIView):

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