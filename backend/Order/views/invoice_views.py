from django.http import HttpResponse
from django.template.loader import render_to_string

from Order.services.invoice_services import InvoiceService


def generate_invoice_html_view(request, order):

    invoice = InvoiceService.generate_bill(
        order_id=order
    )

    html = render_to_string(
        "invoice.html",
        {
            "invoice": invoice
        },
        request=request,
    )

    return HttpResponse(html)