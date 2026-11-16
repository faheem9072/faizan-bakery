import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id: params.id }, { invoiceNumber: params.id }],
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, reason = 'Order cancelled / returned' } = body;

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const cancelledInvoice = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: params.id },
        include: { items: true, customer: true },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'CANCELLED') {
        throw new Error('Invoice is already cancelled');
      }

      // 1. Mark status CANCELLED with audit trail
      const updated = await tx.invoice.update({
        where: { id: params.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
        include: { items: true, customer: true },
      });

      // 2. Reverse Product Stock
      for (const item of invoice.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod && prod.stockTracking) {
          const newStock = prod.currentStock + item.quantity;
          await tx.product.update({
            where: { id: prod.id },
            data: { currentStock: newStock },
          });

          await tx.stockMovement.create({
            data: {
              productId: prod.id,
              type: 'SALE_RETURN',
              quantity: item.quantity,
              balanceAfter: newStock,
              referenceId: invoice.id,
              notes: `Stock restored from Cancelled Bill #${invoice.invoiceNumber}`,
            },
          });
        }
      }

      // 3. Reverse Customer Balance
      // The net balance impact of this invoice on the customer was (grandTotal - paidAmount).
      // Reversing it means reducing the customer's balance by remainingAmount.
      const netDebtToReverse = invoice.remainingAmount;
      const newCustomerBalance = invoice.customer.currentOutstandingBalance - netDebtToReverse;

      await tx.customer.update({
        where: { id: invoice.customerId },
        data: { currentOutstandingBalance: newCustomerBalance },
      });

      // 4. Create Reversal Audit Transaction
      await tx.customerTransaction.create({
        data: {
          customerId: invoice.customerId,
          type: 'INVOICE_CANCELLED',
          referenceId: invoice.id,
          referenceNumber: invoice.invoiceNumber,
          debit: 0,
          credit: netDebtToReverse,
          balanceAfter: newCustomerBalance,
          description: `Reversal of Cancelled Bill #${invoice.invoiceNumber}. Reason: ${reason}`,
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: 'Invoice cancelled and stock/balance reversed successfully',
      invoice: cancelledInvoice,
    });
  } catch (error: any) {
    console.error('Invoice Cancellation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

