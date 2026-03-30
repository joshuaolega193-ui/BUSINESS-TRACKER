from django.urls import path
from .views import DashboardSummaryView
from .sales_views import SaleListCreateView, SaleDetailView
from .expense_views import ExpenseListCreateView, ExpenseDetailView

urlpatterns = [
    # Dashboard
    path('summary', DashboardSummaryView.as_view(), name='dashboard-summary'),

    # Sales
    path('sales/', SaleListCreateView.as_view(), name='sales-list-create'),
    path('sales/<int:pk>/', SaleDetailView.as_view(), name='sales-detail'),

    # Expenses
    path('expenses/', ExpenseListCreateView.as_view(), name='expenses-list-create'),
    path('expenses/<int:pk>/', ExpenseDetailView.as_view(), name='expenses-detail'),
]