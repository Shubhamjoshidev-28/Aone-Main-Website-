from rest_framework import serializers

from Accounts.models.accounts import (
    Account
)


class StaffSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=False
    )

    class Meta:

        model = Account

        fields = (
            "id",
            "username",
            "password",
            "Name",
            "Phone_No",
            "Role",
            "is_active",
            "created_at"
        )

        read_only_fields = (
            "id",
            "Role",
            "created_at"
        )

        extra_kwargs = {
            "password": {
                "write_only": True
            }
        }