from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Product(models.Model):
    """Represents a product in the inventory"""

    CATEGORY_CHOICES = [
        ('electronics', 'Electronics'),
        ('clothing', 'Clothing'),
        ('food', 'Food & Beverages'),
        ('stationery', 'Stationery'),
        ('furniture', 'Furniture'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='products'
    )
    name = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50, choices=CATEGORY_CHOICES, default='other'
    )
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=0)
    initial_quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def stock_value(self):
        """Total value of current stock"""
        return self.quantity * self.unit_price

    @property
    def stock_percentage(self):
        """Current stock as percentage of initial quantity"""
        if self.initial_quantity == 0:
            return 100
        return (self.quantity / self.initial_quantity) * 100

    @property
    def is_low_stock(self):
        """True if stock is at or below 50% of initial quantity"""
        return self.stock_percentage <= 50

    def __str__(self):
        return f"{self.name} ({self.quantity} units)"