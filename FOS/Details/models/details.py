from django.db import (
    models
)

class Details (
    models.Model
):
    ROLE_CHOCIES = (
        ("Owner","owner"),
        ("Staff","staff"),
    )

    
    id = models.BigAutoField(
        primary_key=True
    )
    Name = models.CharField(
        max_length=30, 
        null=True,
        blank=True
    )
    Phone = models.CharField(
        max_length=20,
        null=True,
        blank=True
    )
    Role = models.CharField(
        choices=ROLE_CHOCIES,
        max_length=20,
    )
    is_active = models.BooleanField(
        default=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )