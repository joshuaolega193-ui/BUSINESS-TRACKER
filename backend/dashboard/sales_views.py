from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Sale
from .serializers import SaleSerializer
from inventory.models import Product
from inventory.views import send_low_stock_alert


class SaleListCreateView(APIView):
    """
    GET  /api/sales/ — returns all sales for logged in user
    POST /api/sales/ — creates a new sale and updates inventory
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sales = Sale.objects.filter(user=request.user).order_by('-date')
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SaleSerializer(data=request.data)
        if serializer.is_valid():
            sale = serializer.save(user=request.user)

            # Auto update inventory if matching product exists
            try:
                product = Product.objects.get(
                    user=request.user,
                    name__iexact=sale.item_name  # case insensitive match
                )
                was_low_stock = product.is_low_stock

                # Reduce stock by sale quantity
                product.quantity = max(0, product.quantity - sale.quantity)
                product.save()

                # Send alert if product just became low stock
                if product.is_low_stock and not was_low_stock:
                    send_low_stock_alert(product, request.user)

            except Product.DoesNotExist:
                # No matching product found — skip inventory update
                pass

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SaleDetailView(APIView):
    """
    PUT    /api/sales/<id>/ — update a sale
    DELETE /api/sales/<id>/ — delete a sale
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Sale.objects.get(pk=pk, user=user)
        except Sale.DoesNotExist:
            return None

    def put(self, request, pk):
        sale = self.get_object(pk, request.user)
        if not sale:
            return Response(
                {'error': 'Sale not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        old_quantity = sale.quantity
        serializer = SaleSerializer(sale, data=request.data)

        if serializer.is_valid():
            updated_sale = serializer.save(user=request.user)

            # Adjust inventory for quantity difference
            try:
                product = Product.objects.get(
                    user=request.user,
                    name__iexact=updated_sale.item_name
                )
                was_low_stock = product.is_low_stock
                quantity_diff = updated_sale.quantity - old_quantity
                product.quantity = max(0, product.quantity - quantity_diff)
                product.save()

                if product.is_low_stock and not was_low_stock:
                    send_low_stock_alert(product, request.user)

            except Product.DoesNotExist:
                pass

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        sale = self.get_object(pk, request.user)
        if not sale:
            return Response(
                {'error': 'Sale not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Restore inventory when sale is deleted
        try:
            product = Product.objects.get(
                user=request.user,
                name__iexact=sale.item_name
            )
            product.quantity += sale.quantity
            product.save()
        except Product.DoesNotExist:
            pass

        sale.delete()
        return Response(
            {'message': 'Sale deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )