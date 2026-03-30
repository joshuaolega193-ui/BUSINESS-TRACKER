from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Receipt
from .serializers import ReceiptSerializer


class ReceiptListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        receipts = Receipt.objects.filter(
            user=request.user
        ).order_by('-created_at')
        serializer = ReceiptSerializer(receipts, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReceiptSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class ReceiptDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Receipt.objects.get(pk=pk, user=user)
        except Receipt.DoesNotExist:
            return None

    def get(self, request, pk):
        receipt = self.get_object(pk, request.user)
        if not receipt:
            return Response(
                {'error': 'Receipt not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(ReceiptSerializer(receipt).data)

    def put(self, request, pk):
        receipt = self.get_object(pk, request.user)
        if not receipt:
            return Response(
                {'error': 'Receipt not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ReceiptSerializer(receipt, data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        receipt = self.get_object(pk, request.user)
        if not receipt:
            return Response(
                {'error': 'Receipt not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        receipt.delete()
        return Response(
            {'message': 'Receipt deleted'},
            status=status.HTTP_204_NO_CONTENT
        )