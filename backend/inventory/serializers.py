from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Serializes product data including computed fields"""
    stock_value = serializers.ReadOnlyField()
    stock_percentage = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'description',
            'quantity', 'initial_quantity', 'unit_price',
            'stock_value', 'stock_percentage', 'is_low_stock',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        # Set initial_quantity to match quantity on first creation
        if 'initial_quantity' not in validated_data:
            validated_data['initial_quantity'] = validated_data.get('quantity', 0)
        return super().create(validated_data)