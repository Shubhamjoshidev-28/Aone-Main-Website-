from rest_framework.views import (
    APIView
)
from Accounts.serializer.register_serializer import (
    RegisterSerializer
)
from rest_framework.response import (
    Response
)
from rest_framework import (
    status
)
from rest_framework.permissions import (
    AllowAny
)
from Accounts.services.auth_services import (
    AuthService
)

class RegisterAPIView(
    APIView
):
    permission_classes=[AllowAny]
    
    def post(
        self,
        request
    ):
        
        serializer  = RegisterSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = AuthService.register_user(
            validated_data=serializer.validated_data
        )

        return Response (
            {
                "success":True,
                "message":"Owner created successfully",
                "user": {
                
                    "id": user.id,
                    "name": user.Name,
                    "username": user.username,
                    "password": user.password,
                    "phone_no": user.Phone_No,
                    "role": user.Role
                }
            },
            status =status.HTTP_201_CREATED
        )

