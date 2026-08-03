from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from Accounts.serializer.login_serializer import (
    LoginSerializer
)
from Accounts.permissions.owner_permission import (
    IsOwner
)
from Accounts.services.auth_services import (
    AuthService
)
from rest_framework.permissions import (
    AllowAny
)


class LoginAPIView(APIView):
    permission_classes=[AllowAny]

    def post(
        self,
        request
    ):

        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = AuthService.login_user(
            serializer.validated_data
        )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,

                "message": "Login Successful.",

                "access": str(
                    refresh.access_token
                ),

                "refresh": str(
                    refresh
                ),

                "user": {

                    "id": user.id,

                    "name": user.Name,

                    "username": user.username,

                    "phone_no": user.Phone_No,

                    "role": user.Role

                }

            },
            status=status.HTTP_200_OK
        )