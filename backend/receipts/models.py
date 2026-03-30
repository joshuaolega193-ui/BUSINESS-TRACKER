from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Receipt(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='receipts'
    )
    receipt_number = models.CharField(max_length=50)
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField(blank=True)
    items = models.JSONField(default=list)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Receipt {self.receipt_number} - {self.customer_name}"