from django.urls import (
    path
)
from Menu.views.menu_views import (
    CreateMenuView,
    EditMenuView,
    DeleteMenuView,
    GetMenuView
)


urlpatterns = [
    path("create_item/",CreateMenuView.as_view(),name='create_item'),
    path("edit_item/<int:item_id>/",EditMenuView.as_view(),name='edit_item'),
    path("get_menu/",GetMenuView.as_view(),name='get_menu'),
    path("delete_item/<int:item_id>/",DeleteMenuView.as_view(),name='delete_item'),
]