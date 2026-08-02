from Accounts.serializer.staff_serialzer import (
    StaffSerializer
)
from Accounts.services.staff_services import (
    StaffService
)
from rest_framework.response import (
    Response
)
from rest_framework import (
    status
)
from rest_framework.views import (
    APIView
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


class CreateStaffAPIView(APIView):

    permission_classes = [
        IsOwner,
        IsAuthenticated
    ]
    authentication_classes = [
        JWTAuthentication
    ]


    def post(
        self,
        request
    ):

        serializer = StaffSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        staff = StaffService.create_staff(
            serializer.validated_data
        )

        return Response(
            {
                "success": True,
                "message": "Staff created successfully.",
                "staff": StaffSerializer(
                    staff
                ).data
            },
            status=status.HTTP_201_CREATED
        )

class UpdateStaffAPIView(APIView):

    permission_classes = [
        IsOwner,
        IsAuthenticated
    ]
    authentication_classes = [
        JWTAuthentication
    ]


    def patch(
        self,
        request,
        user_id
    ):

        serializer = StaffSerializer(
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        staff = StaffService.update_staff(
            user_id,
            serializer.validated_data
        )

        return Response(
            {
                "success": True,
                "message": "Staff updated successfully.",
                "staff": StaffSerializer(
                    staff
                ).data
            }
        )



class DeleteStaffAPIView(APIView):

    permission_classes = [
        IsOwner,
        IsAuthenticated
    ]
    authentication_classes = [
        JWTAuthentication
    ]


    def delete(
        self,
        request,
        user_id
    ):

        StaffService.delete_staff(
            user_id
        )

        return Response(
            {
                "success": True,
                "message": "Staff deleted successfully."
            }
        )

class StaffListAPIView(APIView):

    permission_classes = [
        IsOwner,
        IsAuthenticated
    ]
    authentication_classes = [
        JWTAuthentication
    ]


    def get(
        self,
        request
    ):

        staff = StaffService.staff_list()

        serializer = StaffSerializer(
            staff,
            many=True
        )

        return Response(
            {
                "success": True,
                "staff": serializer.data
            }
        )

class StaffDetailAPIView(APIView):

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
        user_id
    ):

        staff = StaffService.staff_detail(
            user_id
        )

        serializer = StaffSerializer(
            staff
        )

        return Response(
            {
                "success": True,
                "staff": serializer.data
            }
        )

