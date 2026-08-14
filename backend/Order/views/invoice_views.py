from django.http import HttpResponse
from django.template.loader import render_to_string
from django.templatetags.static import static

from Order.services.invoice_services import InvoiceService


def generate_invoice_html_view(request, order):

    invoice = InvoiceService.generate_bill(
        order_id=order
    )

    qr_code_url = request.build_absolute_uri(static('images/qr_code.png'))

    html = render_to_string(
        "invoice.html",
        {
            "invoice": invoice,
            "qr_code_url": qr_code_url,
        },
        request=request,
    )

    return HttpResponse(html)