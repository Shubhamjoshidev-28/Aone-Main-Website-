from rest_framework.views import (
    APIView
)
from Order.serializer.order_serializer import (
    OrderSerializer
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

class CreateOrderView(
    APIView
):
    def post (
        self,
        request
    ):
        serializer = OrderSerializer(
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
                "order":serializer.data
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
        serializer = OrderSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        order = OrderService.update_order(
            order_id
        )
        return Response (
            {
                "success":True,
                "message":"Order Updated Successfully",
                "order":serializer.data
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


def OrderListView (
        APIView
):
    def get (
            self,
            request
    ):
        order=OrderService.order_list()

        return Response (
            {
                "success":True,
                "message":"Order Fetch Successfully",
                "order":order
            },
            status = status.HTTP_200_OK   
        )

def OrderDetailsView(
        APIView
):
    def get(
            self,
            request,
            order_id
    ):
        order=OrderService.order_details(
            order_id
        )
        return Response (
            {
                "success":True,
                "message":"Order Details Successfully Fetched",
                "order":order
            },
            status= status.HTTP_200_OK
        )
        