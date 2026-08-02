from Accounts.models.accounts import (
    Account
)
from django.shortcuts import get_object_or_404

def get_account_by_username(
        username
):
    user = Account.objects.get(
        username=username
    )
    return user

def get_account_by_phone(
        phone_no
):
    user = Account.objects.get(
        Phone_No=phone_no
    )
    return user

def get_account_by_id(
        user_id
):
    user = Account.objects.get(
        id=user_id
    )
    return user

def get_owner ():

    user = Account.objects.filter(
        Role = "Owner",
        is_active = True
    )
    return user

def get_staff ():

    user = Account.objects.filter(
       Role = "Staff"
    )

    return user

def get_active_staff ():
    
    user = Account.objects.filter(
        Role = "Staff",
        is_active = True
    )
    return user 

def get_staff_by_id(user_id):

    return get_object_or_404(
        Account,
        id=user_id,
        Role="Staff",
        is_active=True
    )

def search_staff_by_username(
        username
):
    user = Account.objects.filter(
        username=username,
        Role = "Staff",
        is_active=True
    )


