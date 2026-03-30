from rest_framework import serializers
from .models import Sale, Expense


class SaleSerializer(serializers.ModelSerializer):
    """Serializes sale data — total is auto calculated in model"""
    class Meta:
        model = Sale
        fields = [
            'id', 'item_name', 'quantity',
            'unit_price', 'total', 'date', 'created_at'
        ]
        # Total is calculated automatically, no need to send it
        read_only_fields = ['total', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializes expense data"""
    class Meta:
        model = Expense
        fields = [
            'id', 'description', 'amount',
            'category', 'date', 'created_at'
        ]
        read_only_fields = ['created_at']