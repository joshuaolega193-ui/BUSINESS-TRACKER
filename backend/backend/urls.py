from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/invoices/', include('invoices.urls')),
    path('api/receipts/', include('receipts.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/reports/', include('reports.urls')),
]
