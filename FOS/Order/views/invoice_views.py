from django.shortcuts import render

from Order.services.invoice_services import InvoiceService



def generate_invoice_view(
        request, 
        order
):

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