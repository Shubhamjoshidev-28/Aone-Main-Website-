from rest_framework.views import (
    APIView
)
from Order.serializer.create_order_serializer import (
    CreateOrderSerializer
)
from Order.serializer.order_detail_serializer import (
    OrderDetailSerializer
)
from Order.serializer.update_order_serializer import (
    UpdateOrderSerializer
)
from Order.services.order_service import (
    OrderService
)
from rest_framework.response import (
    Response
)
from rest_framework import (
    status
)
from Accounts.permissions.owner_permission import (
    IsOwner
)
from rest_framework.permissions import (
    IsAuthenticated
)
from rest_framework_simplejwt.authentication import (
    JWTAuthentication
)

class CreateOrderView(
    APIView
):
    def post (
        self,
        request
    ):
        serializer = CreateOrderSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        order = OrderService.create_order(
            validated_data=serializer.validated_data
        )

        return Response (
            {
                "success":True,
                "message":"Order Created Successfully",
                "order": OrderDetailSerializer(order).data
            },
            status=status.HTTP_201_CREATED
        )

class EditOrderView (
    APIView
):
    def patch (
            self,
            request,
            order_id
    ):
        serializer = UpdateOrderSerializer(
            data=request.data,
            partial = True
        )
        serializer.is_valid(
            raise_exception=True
        )
        order = OrderService.update_order(
            order_id,
            validated_data=serializer.validated_data
        )
        return Response (
            {
                "success":True,
                "message":"Order Updated Successfully",
                "order": OrderDetailSerializer(order).data
            },
            status = status.HTTP_200_OK
        )

class DeleteOrderView(
    APIView
):
    def delete (
            self,
            request,
            order_id
    ):

        order=OrderService.delete_order(
            order_id
        )

        return Response (
            {
                "success":True,
                "message":"Order Delete Succesfully",
            },
            status = status.HTTP_200_OK
        )


class OrderListView (
        APIView
):
    permission_classes = [
        IsOwner,
        IsAuthenticated
    ]
    authentication_classes = [
        JWTAuthentication
    ]
    def get (
            self,
            request
    ):
        order=OrderService.order_list()

        return Response (
            {
                "success":True,
                "message":"Order Fetch Successfully",
                "order":OrderDetailSerializer(order, many=True).data
            },
            status = status.HTTP_200_OK   
        )

class OrderDetailsView(
        APIView
):
    permission_classes = [
        IsOwner,
        IsAuthenticated
    ]
    authentication_classes = [
        JWTAuthentication
    ]
    def get(
            self,
            request,
            order_id
    ):
        order = OrderService.order_details(order_id)

        return Response(
          {
              "success": True,
              "order": OrderDetailSerializer(order).data
          }
        )    
        