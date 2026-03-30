from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from datetime import date, timedelta

from .models import Sale, Expense


class DashboardSummaryView(APIView):
    """
    GET /api/dashboard/summary
    Returns totals, chart data and recent transactions
    for the currently logged in user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # --- Totals ---
        total_sales = Sale.objects.filter(user=user).aggregate(
            total=Sum('total')
        )['total'] or 0

        total_expenses = Expense.objects.filter(user=user).aggregate(
            total=Sum('amount')
        )['total'] or 0

        net_profit = total_sales - total_expenses

        # --- Monthly sales for chart (last 6 months) ---
        six_months_ago = date.today() - timedelta(days=180)

        monthly_sales = (
            Sale.objects
            .filter(user=user, date__gte=six_months_ago)
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('total'))
            .order_by('month')
        )

        chart_labels = []
        chart_data = []

        for entry in monthly_sales:
            chart_labels.append(entry['month'].strftime('%b %Y'))
            chart_data.append(float(entry['total']))

        # --- Recent transactions (last 5 sales + expenses) ---
        recent_sales = Sale.objects.filter(user=user).order_by('-created_at')[:5]
        recent_expenses = Expense.objects.filter(user=user).order_by('-created_at')[:5]

        recent_transactions = []

        for sale in recent_sales:
            recent_transactions.append({
                'type': 'sale',
                'description': sale.item_name,
                'amount': float(sale.total),
                'date': sale.date,
            })

        for expense in recent_expenses:
            recent_transactions.append({
                'type': 'expense',
                'description': expense.description,
                'amount': float(expense.amount),
                'date': expense.date,
            })

        # Sort combined list by date descending
        recent_transactions.sort(key=lambda x: x['date'], reverse=True)

        return Response({
            'total_sales': float(total_sales),
            'total_expenses': float(total_expenses),
            'net_profit': float(net_profit),
            'chart': {
                'labels': chart_labels,
                'data': chart_data,
            },
            'recent_transactions': recent_transactions[:8],
        })