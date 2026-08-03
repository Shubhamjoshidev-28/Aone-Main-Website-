from rest_framework import serializers
from Accounts.models.accounts import (
    Account
)


class RegisterSerializer(serializers.ModelSerializer):

    confirm_password = serializers.CharField(
        write_only=True
    )
    Phone_No = serializers.CharField(
        required = False
    )

    class Meta:

        model = Account

        fields = (
            "Name",
            "username",
            "Phone_No",
            "password",
            "confirm_password",
            "Role"
        )

        extra_kwargs = {
            "password": {
                "write_only": True
            }
        }

    def validate(self, attrs):

        if attrs["password"] != attrs["confirm_password"]:

            raise serializers.ValidationError(
                {
                    "confirm_password":
                    "Passwords do not match."
                }
            )

        if Account.objects.filter(
            Role="Owner"
        ).exists():

            raise serializers.ValidationError(
                {
                    "Owner":
                    "Owner already registered."
                }
            )

        return attrs

    def create(self, validated_data):

        validated_data.pop(
            "confirm_password"
        )

        validated_data["Role"] = "Owner"

        return Account.objects.create(
            **validated_data
        )