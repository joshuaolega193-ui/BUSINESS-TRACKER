from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Sum, F, FloatField
from invoices.models import Invoice
from inventory.models import Product 
from dashboard.models import Expense

class FinancialSummaryView(APIView):
    permission_classes = [AllowAny] 

    def get(self, request):
        # Total Revenue (Paid Invoices)
        total_revenue = Invoice.objects.filter(status='paid').aggregate(
            res=Sum('total')
        )['res'] or 0
        
        # Total Stock Value (Quantity * Unit_Price)
        total_stock_value = Product.objects.aggregate(
            total=Sum(F('quantity') * F('unit_price'), output_field=FloatField())
        )['total'] or 0

        # 2. Total Expenses
        # Note: Check if your field is 'amount' or 'cost' in expenses/models.py
        total_expenses = Expense.objects.aggregate(
            total=Sum('amount')
        )['total'] or 0

        # 3. Calculate Net Profit
        net_profit = float(total_revenue) - float(total_expenses)
        
        return Response({
            "total_revenue": float(total_revenue),
            "total_stock_value": float(total_stock_value),
            "total_expenses": float(total_expenses),
            "net_profit": net_profit,
            "report_generated_at": "2026-03-28"
        })