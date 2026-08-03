from django.urls import (
    path
)
from Order.views.order_views import (
    CreateOrderView,
    EditOrderView,
    DeleteOrderView,
    OrderListView,
    OrderDetailsView
)
from Order.views.invoice_views import (
    generate_invoice_view
)

urlpatterns = [
    path('create_order/',CreateOrderView.as_view(),name='create_order'),
    path('edit_order/<int:order>/',EditOrderView.as_view(),name='edit_order'),
    path('delete_order/<int:order>/',DeleteOrderView.as_view(),name='delete_order'),
    path('get_order/',OrderListView.as_view(),name='get_order'),
    path('order_details/<int:order>/',OrderDetailsView.as_view(),name='order_details'),
    path('print_invoice/<int:order>/',generate_invoice_view,name='print_invoice')
]