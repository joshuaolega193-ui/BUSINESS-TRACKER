from rest_framework import serializers
from .models import Receipt


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = [
            'id', 'receipt_number', 'customer_name', 'customer_email',
            'items', 'subtotal', 'tax_rate', 'tax_amount', 'total',
            'date', 'notes', 'created_at'
        ]
        read_only_fields = ['created_at']

    def create(self, validated_data):
        items = validated_data.get('items', [])
        subtotal = sum(
            float(item.get('quantity', 0)) * float(item.get('unit_price', 0))
            for item in items
        )
        tax_rate = float(validated_data.get('tax_rate', 0))
        tax_amount = subtotal * (tax_rate / 100)
        total = subtotal + tax_amount
        validated_data['subtotal'] = subtotal
        validated_data['tax_amount'] = tax_amount
        validated_data['total'] = total
        return super().create(validated_data)

    def update(self, instance, validated_data):
        items = validated_data.get('items', instance.items)
        subtotal = sum(
            float(item.get('quantity', 0)) * float(item.get('unit_price', 0))
            for item in items
        )
        tax_rate = float(validated_data.get('tax_rate', instance.tax_rate))
        tax_amount = subtotal * (tax_rate / 100)
        total = subtotal + tax_amount
        validated_data['subtotal'] = subtotal
        validated_data['tax_amount'] = tax_amount
        validated_data['total'] = total
        return super().update(instance, validated_data)