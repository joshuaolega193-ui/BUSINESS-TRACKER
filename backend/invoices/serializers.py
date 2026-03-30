from rest_framework import serializers
from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total']
        read_only_fields = ['total']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client_name', 'client_email',
            'client_address', 'issue_date', 'due_date', 'tax_rate',
            'subtotal', 'tax_amount', 'total', 'status', 'notes',
            'items', 'created_at'
        ]
        read_only_fields = ['subtotal', 'tax_amount', 'total', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        subtotal = 0
        for item_data in items_data:
            item_data['total'] = item_data['quantity'] * item_data['unit_price']
            InvoiceItem.objects.create(invoice=invoice, **item_data)
            subtotal += item_data['total']
        tax_amount = subtotal * (invoice.tax_rate / 100)
        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total = subtotal + tax_amount
        invoice.save()
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.items.all().delete()
        subtotal = 0
        for item_data in items_data:
            item_data['total'] = item_data['quantity'] * item_data['unit_price']
            InvoiceItem.objects.create(invoice=instance, **item_data)
            subtotal += item_data['total']
        tax_amount = subtotal * (instance.tax_rate / 100)
        instance.subtotal = subtotal
        instance.tax_amount = tax_amount
        instance.total = subtotal + tax_amount
        instance.save()
        return instance