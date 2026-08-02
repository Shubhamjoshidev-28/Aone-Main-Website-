from django.shortcuts import render

from Order.services.invoice_services import InvoiceService
from Accounts.permissions.owner_permission import (
    IsOwner
)
from rest_framework.permissions import (
    IsAuthenticated
)
from rest_framework_simplejwt.authentication import (
    JWTAuthentication
)



def generate_invoice_view(
        request, 
        order
):
    permission_classes = [
        IsOwner,
        IsAuthenticated
    ]
    authentication_classes = [
        JWTAuthentication
    ]

    invoice = InvoiceService.generate_bill(
        order_id=order
    )

    return render(
        request,
        "invoice.html",
        {
            "invoice": invoice
        }
    )