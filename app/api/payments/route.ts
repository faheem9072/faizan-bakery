import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || '';
    const date = searchParams.get('date');
    const paymentMethod = searchParams.get('paymentMethod');

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (paymentMethod && paymentMethod !== 'All') where.paymentMethod = paymentMethod;
    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      where.paymentDate = { gte: dayStart, lte: dayEnd };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      take: 100,
      include: {
        customer: true,
        invoice: true,
      },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Payments GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      invoiceId,
      amount,
      paymentMethod = 'CASH',
      transactionReference,
      notes,
      createdById,
    } = body;

    const numAmount = parseFloat(amount);
    if (!customerId || !numAmount || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid customer and positive payment amount are required' },
        { status: 400 }
      );
    }

    const payment = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate receipt number
      const currentYear = new Date().getFullYear();
      const count = await tx.payment.count();
      const receiptNumber = `REC-${currentYear}-${String(count + 1).padStart(4, '0')}`;

      // Create Payment
      const newPayment = await tx.payment.create({
        data: {
          receiptNumber,
          customerId,
          invoiceId: invoiceId || null,
          amount: numAmount,
          paymentMethod,
          transactionReference: transactionReference || null,
          notes: notes || null,
          createdById: createdById || null,
        },
        include: {
          customer: true,
          invoice: true,
        },
      });

      // Update customer balance: payments reduce customer debt
      const balanceAfter = customer.currentOutstandingBalance - numAmount;
      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentOutstandingBalance: balanceAfter,
        },
      });

      // Create customer transaction record
      await tx.customerTransaction.create({
        data: {
          customerId,
          type: 'PAYMENT',
          referenceId: newPayment.id,
          referenceNumber: receiptNumber,
          debit: 0,
          credit: numAmount,
          balanceAfter,
          description: `Payment received via ${paymentMethod}${invoiceId ? ' for specific invoice' : ''} (Receipt #${receiptNumber})`,
        },
      });

      // If tied to a specific invoice, update that invoice's paid/remaining
      if (invoiceId) {
        const inv = await tx.invoice.findUnique({ where: { id: invoiceId } });
        if (inv && inv.status !== 'CANCELLED') {
          const newPaid = inv.paidAmount + numAmount;
          const newRemaining = Math.max(0, inv.grandTotal - newPaid);
          const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';
          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newStatus,
            },
          });
        }
      }

      return newPayment;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Payment POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

