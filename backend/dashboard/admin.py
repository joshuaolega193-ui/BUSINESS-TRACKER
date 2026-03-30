from django.contrib import admin
from .models import Sale, Expense

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'quantity', 'unit_price', 'total', 'date', 'user']
    list_filter = ['date', 'user']

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'category', 'date', 'user']
    list_filter = ['category', 'date', 'user']