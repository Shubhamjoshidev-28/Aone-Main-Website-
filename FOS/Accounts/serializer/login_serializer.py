from rest_framework import serializers

from django.contrib.auth.hashers import check_password

from Accounts.models.accounts import (
    Account
)


class LoginSerializer(serializers.Serializer):

    username = serializers.CharField()

    password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):

        username = attrs.get(
            "username"
        )

        password = attrs.get(
            "password"
        )

        return attrs

        

            