from django.db import models
from django.contrib.auth.models import (
    AbstractUser
)

class Account(AbstractUser):

    ROLE_CHOICES = (
        ("Owner", "Owner"),
        ("Staff", "Staff"),
    )

    Name = models.CharField(
        max_length=50
    )

    Phone_No = models.CharField(
        max_length=15,
        null=True,
        blank=True
    )

    Role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default="Staff",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.Name