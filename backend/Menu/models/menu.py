from django.db import (
    models
)
from django.core.validators import (
    MinValueValidator
)
from decimal import (
    Decimal
)


class Menu(
    models.Model
):
    ITEMS_SIZE_CHOICES = (
        ("Half","half"),
        ("Full","full"),
    )
    ITEM_CATEGORY_CHOICES = (
    ("Special Items", "Special Items"),
    ("Tandoori Items", "Tandoori Items"),
    ("Non Veg Snacks", "Non Veg Snacks"),
    ("Non Veg Main Course", "Non Veg Main Course"),
    ("Kebab", "Kebab"),
    ("Fish Special", "Fish Special"),
    ("Veg Snacks", "Veg Snacks"),
    ("Veg Main Course", "Veg Main Course"),
    ("Roti / Prantha", "Roti / Prantha"),
    ("Pasta", "Pasta"),
    ("Beverages", "Beverages"),
    ("Salad", "Salad"),
)
    ITEM_CATEGORY_CHOICES = (
    ("Special Items", "Special Items"),
    ("Tandoori Items", "Tandoori Items"),
    ("Non Veg Snacks", "Non Veg Snacks"),
    ("Non Veg Main Course", "Non Veg Main Course"),
    ("Kebab", "Kebab"),
    ("Fish Special", "Fish Special"),
    ("Veg Snacks", "Veg Snacks"),
    ("Veg Main Course", "Veg Main Course"),
    ("Roti / Prantha", "Roti / Prantha"),
    ("Pasta", "Pasta"),
    ("Beverages", "Beverages"),
    ("Salad", "Salad"),
)

    id = models.BigAutoField(
        primary_key=True
    )
    Item_Name = models.CharField(
        max_length=50,
    )
    Item_Category = models.CharField(
        choices=ITEM_CATEGORY_CHOICES,
        max_length=50,
    )
    Item_Size = models.CharField(
        choices=ITEMS_SIZE_CHOICES,
        max_length=10,
    )
    Item_Price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        null=True,
        blank=True
    )
    is_available = models.BooleanField(
        default=True
    )
    created_at = models.DateField(
        auto_now_add=True
    )