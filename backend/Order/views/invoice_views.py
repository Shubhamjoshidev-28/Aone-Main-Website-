from django.http import HttpResponse
from django.template.loader import render_to_string
from time import perf_counter

from Order.utils.html_to_pdf import html_to_pdf
from Order.services.invoice_services import InvoiceService

from Accounts.permissions.owner_permission import IsOwner
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication


def generate_invoice_view(request, order):
    total_start = perf_counter()

    invoice_start = perf_counter()
    invoice = InvoiceService.generate_bill(
        order_id=order
    )
    invoice_elapsed = perf_counter() - invoice_start

    # Render the existing dynamic Django template to HTML
    template_start = perf_counter()
    html = render_to_string(
        "invoice.html",
        {
            "invoice": invoice
        },
        request=request,
    )
    template_elapsed = perf_counter() - template_start

    # Convert the already-rendered HTML into PDF
    pdf_start = perf_counter()
    pdf_bytes = html_to_pdf(html)
    pdf_elapsed = perf_counter() - pdf_start

    total_elapsed = perf_counter() - total_start
    print(f"InvoiceService: {invoice_elapsed:.3f}s")
    print(f"Template: {template_elapsed:.3f}s")
    print(f"HTML -> PDF: {pdf_elapsed:.3f}s")
    print(f"Total: {total_elapsed:.3f}s")

    # Return PDF through API
    response = HttpResponse(
        pdf_bytes,
        content_type="application/pdf",
    )

    response["Content-Disposition"] = (
        f'inline; filename="invoice-{order}.pdf"'
    )

    return response