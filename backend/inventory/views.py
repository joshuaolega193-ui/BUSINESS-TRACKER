from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from .models import Product
from .serializers import ProductSerializer


def send_low_stock_alert(product, user):
    """Send email alert when stock drops to or below 50%"""
    if not settings.EMAIL_HOST_USER:
        print('No email configured')
        return
    try:
        result = send_mail(
            subject=f'Low Stock Alert: {product.name}',
            message=(
                f'Dear {user.name},\n\n'
                f'This is an automated alert from Business Tracker.\n\n'
                f'Product: {product.name}\n'
                f'Current Stock: {product.quantity} units\n'
                f'Initial Stock: {product.initial_quantity} units\n'
                f'Stock Level: {product.stock_percentage}%\n\n'
                f'Your stock for {product.name} has dropped to '
                f'{product.stock_percentage}% of its initial level.\n'
                f'Please restock soon.\n\n'
                f'Business Tracker'
            ),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False,
        )
        print(f'Email sent to {user.email}, result: {result}')
    except Exception as e:
        print(f'Email error: {e}')


class ProductListCreateView(APIView):
    """
    GET  /api/inventory/ — list all products
    POST /api/inventory/ — add a new product
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(
            user=request.user
        ).order_by('name')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            quantity = serializer.validated_data.get('quantity', 0)
            product = serializer.save(
                user=request.user,
                initial_quantity=quantity
            )
            # Send alert if new product is already low stock
            if product.is_low_stock:
                send_low_stock_alert(product, request.user)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class ProductDetailView(APIView):
    """
    GET    /api/inventory/<id>/ — get single product
    PUT    /api/inventory/<id>/ — update product
    DELETE /api/inventory/<id>/ — delete product
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Product.objects.get(pk=pk, user=user)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self.get_object(pk, request.user)
        if not product:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(ProductSerializer(product).data)

    def put(self, request, pk):
        product = self.get_object(pk, request.user)
        if not product:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check stock status before update
        was_low_stock = product.is_low_stock

        serializer = ProductSerializer(product, data=request.data)
        if serializer.is_valid():
            updated_product = serializer.save(user=request.user)

            # Send alert if product just became low stock
            if updated_product.is_low_stock and not was_low_stock:
                send_low_stock_alert(updated_product, request.user)
                print(f'Low stock alert triggered for {updated_product.name}')
            else:
                print(f'No alert needed. is_low_stock={updated_product.is_low_stock}, was_low_stock={was_low_stock}')

            return Response(serializer.data)
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        product = self.get_object(pk, request.user)
        if not product:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        product.delete()
        return Response(
            {'message': 'Product deleted'},
            status=status.HTTP_204_NO_CONTENT
        )