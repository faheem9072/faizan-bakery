import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'all'; // 'today', 'week', 'month', 'all', 'custom'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const now = new Date();
    let filterStart: Date | null = null;
    let filterEnd: Date | null = null;

    if (range === 'today') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (range === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      filterStart = new Date(now.setDate(diff));
      filterStart.setHours(0, 0, 0, 0);
      filterEnd = new Date();
    } else if (range === 'month') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      filterEnd = new Date();
    } else if (range === 'custom' && startDate && endDate) {
      filterStart = new Date(`${startDate}T00:00:00.000Z`);
      filterEnd = new Date(`${endDate}T23:59:59.999Z`);
    }

    // Fetch all active customers with their transactions
    const customers = await prisma.customer.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { currentOutstandingBalance: 'desc' },
      include: {
        invoices: {
          where: {
            status: { in: ['UNPAID', 'PARTIAL'] },
          },
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            grandTotal: true,
            paidAmount: true,
            remainingAmount: true,
            status: true,
          },
        },
        transactions: filterStart
          ? {
            where: {
              date: {
                gte: filterStart,
                lte: filterEnd || new Date(),
              },
            },
          }
          : false,
      },
    });

    let totalOutstanding = 0;
    const customerLedgers = customers.map((c) => {
      totalOutstanding += c.currentOutstandingBalance;

      let newCredit = 0;
      let paymentsReceived = 0;

      if (Array.isArray(c.transactions)) {
        for (const t of c.transactions) {
          if (t.type === 'INVOICE') newCredit += t.debit;
          if (t.type === 'PAYMENT') paymentsReceived += t.credit;
        }
      }

      return {
        id: c.id,
        shopName: c.shopName,
        ownerName: c.ownerName,
        mobileNumber: c.mobileNumber,
        address: c.address,
        openingBalance: c.openingBalance,
        currentOutstandingBalance: c.currentOutstandingBalance,
        creditLimit: c.creditLimit,
        pendingInvoices: c.invoices,
        pendingInvoicesCount: c.invoices.length,
        periodNewCredit: newCredit,
        periodPaymentsReceived: paymentsReceived,
      };
    });

    return NextResponse.json({
      totalOutstanding,
      customerCount: customers.length,
      customersWithBalanceCount: customers.filter((c) => c.currentOutstandingBalance > 0).length,
      customers: customerLedgers,
    });
  } catch (error: any) {
    console.error('Credit GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
