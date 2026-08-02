from django.db import (
    models
)
from django.core.validators import (
    MinValueValidator
)
from decimal import (
    Decimal
)
from Accounts.models.accounts import (
    Account
)


class Order (
    models.Model
):
    STATUS_CHOICES=(
        ("Preparing","preparing"),
        ("Accepted","accepted"),
        ("Ready To Collect","ready to collect"),
        ("Delivered","delivered")
    )
    PAYMENT_STATUS_CHOICES=(
        ("Pending","pending"),
        ("Paid","paid")
    )
    PAYMENT_TYPE=(
        ("Online","online"),
        ("Offline","offline")
    )
    SOURCE_CHOICES = (
        ("Customer", "customer"),
        ("Owner", "owner"),
        ("Staff", "staff"),
    )

    id = models.BigAutoField(
        primary_key=True,
    )
    Cust_Name = models.CharField(
        max_length=30,
        null= True,
        blank=True
    )
    Table_No = models.PositiveBigIntegerField(
        null=True,
        blank=True
    )
    Car_No = models.CharField(
        max_length=20,
        null = True,
        blank = True
    )
    Phone = models.CharField(
        max_length=15,
        null=True,
        blank=True
    )
    Staff_Assigned = models.ForeignKey(
        Account,
        on_delete=models.SET_NULL,
        related_name='Order',
        null= True,
        blank=True
    )
    Total = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        null=True,
        blank=True
    )
    Source = models.CharField(
        choices=SOURCE_CHOICES,
        max_length=20
    )
    Payment_Status = models.CharField(
        max_length=10,
        null=True,
        blank=True
    )
    Status = models.CharField(
        choices=STATUS_CHOICES,
        max_length=20,
        default='pending'
    )
    Payment_Type = models.CharField(
        choices=PAYMENT_TYPE,
        max_length=20,
        null=True,
        blank=True
    )
    Bill_Printed = models.BooleanField(
        default=False
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )


