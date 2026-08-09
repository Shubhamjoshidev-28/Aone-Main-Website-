from django.http import HttpResponse
from django.template.loader import render_to_string

from Order.utils.html_to_pdf import html_to_pdf
from Order.services.invoice_services import InvoiceService

from Accounts.permissions.owner_permission import IsOwner
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication


def generate_invoice_view(request, order):

    invoice = InvoiceService.generate_bill(
        order_id=order
    )

    # Render the existing dynamic Django template to HTML
    html = render_to_string(
        "invoice.html",
        {
            "invoice": invoice
        },
        request=request,
    )

    # Convert the already-rendered HTML into PDF
    pdf_bytes = html_to_pdf(html)

    # Return PDF through API
    response = HttpResponse(
        pdf_bytes,
        content_type="application/pdf",
    )

    response["Content-Disposition"] = (
        f'inline; filename="invoice-{order}.pdf"'
    )

    return response