from rest_framework.exceptions import (
    ValidationError
)

from Accounts.models.accounts import (
    Account
)

from Accounts.selector.accounts_selector import (
    get_staff,
    get_staff_by_id,
    get_active_staff
)


class StaffService:

    @staticmethod
    def create_staff(validated_data):

     username = validated_data["username"]
 
     if Account.objects.filter(username=username).exists():
         raise ValidationError(
             {
                 "username": "Username already exists."
             }
         )
 
     staff = Account.objects.create_user(
         username=username,
         Name=validated_data["Name"],
         Phone_No=validated_data.get("Phone_No"),
         Role="Staff",
         is_active=validated_data.get("is_active", True)
     )
 
     return staff


    @staticmethod
    def update_staff(
        user_id,
        validated_data
    ):

        staff = get_staff_by_id(
            user_id
        )

        for key, value in validated_data.items():

            setattr(
                staff,
                key,
                value
            )

        staff.save()

        return staff


    @staticmethod
    def delete_staff(
        user_id
    ):

        staff = get_staff_by_id(
            user_id
        )

        staff.is_active = False

        staff.save()

        return staff


    @staticmethod
    def staff_list():

        return get_active_staff()


    @staticmethod
    def staff_detail(
        user_id
    ):

        return get_staff_by_id(
            user_id
        )