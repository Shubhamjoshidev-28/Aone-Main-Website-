from Accounts.models.accounts import (
    Account
)
from rest_framework.exceptions import (
    ValidationError,
    PermissionDenied
)
from django.contrib.auth.hashers import (
    make_password
)
from django.contrib.auth import (
    authenticate
)

class AuthService:

    @staticmethod
    def register_user(
        validated_data
    ):
        
        user = Account.objects.create_user(
            username=validated_data['username'],
            Name=validated_data.get('Name'),
            Phone_No=validated_data.get('Phone_No'),
            password=validated_data['password'],
            Role="Owner"
        )
        return user

    @staticmethod
    def login_user(
        validated_data
    ):
        username = validated_data.get("username")
        entered_password = validated_data.get("password")
    
        user = authenticate(
            username=username,
            password=entered_password
        )
    
        if user is None:
            raise ValidationError(
                {"Username": "Invalid username or password."}
            )
    
        if user.Role != "Owner":
            raise PermissionDenied(
                "Only owners are allowed to login."
            )
    
        return user