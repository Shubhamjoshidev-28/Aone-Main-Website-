from django.urls import (
    path
)
from Accounts.views.login_views import (
    LoginAPIView
)
from Accounts.views.register_views import (
    RegisterAPIView
)
from Accounts.views.staff_views import (
    CreateStaffAPIView,
    UpdateStaffAPIView,
    StaffDetailAPIView,
    StaffListAPIView,
    DeleteStaffAPIView
)
from Accounts.views.login_views import (
    LoginAPIView
)
from Accounts.views.register_views import (
    RegisterAPIView
)

urlpatterns = [
    path('create_staff/',CreateStaffAPIView.as_view(),name='create_staff'),
    path('update_staff/<int:user_id>/',UpdateStaffAPIView.as_view(),name='update_staff'),
    path('staff_detail/<int:user_id>/',StaffDetailAPIView.as_view(),name='staff_detail'),
    path('staff_list/',StaffListAPIView.as_view(),name='staff_list'),
    path('delete_staff/<int:user_id>/',DeleteStaffAPIView.as_view(),name='delete_staff'),
    path('register/',RegisterAPIView.as_view(),name='register'),
    path('login/',LoginAPIView.as_view(),name='login')

]