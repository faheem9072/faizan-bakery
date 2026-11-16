import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    // Today range
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Month range
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // 1. Today's Invoices
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: startOfToday, lte: endOfToday },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: true,
      },
    });

    let todaySales = 0;
    let todayOrders = todayInvoices.length;
    let todayProductsSupplied = 0;

    for (const inv of todayInvoices) {
      todaySales += inv.grandTotal;
      for (const item of inv.items) {
        todayProductsSupplied += item.quantity;
      }
    }

    // 2. Today's Payments
    const todayPayments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startOfToday, lte: endOfToday },
      },
    });

    let todayPaymentsReceived = 0;
    for (const pay of todayPayments) {
      todayPaymentsReceived += pay.amount;
    }

    // 3. Month to Date Metrics
    const monthInvoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: startOfMonth },
        status: { not: 'CANCELLED' },
      },
    });
    const monthlySales = monthInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

    const monthPayments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startOfMonth },
      },
    });
    const monthlyCollection = monthPayments.reduce((acc, pay) => acc + pay.amount, 0);

    // 4. Total Outstanding & Total Customers
    const customers = await prisma.customer.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { currentOutstandingBalance: 'desc' },
    });

    const totalCustomers = customers.length;
    const totalOutstandingCredit = customers.reduce(
      (acc, c) => acc + c.currentOutstandingBalance,
      0
    );

    // 5. Pending Payments (Invoices with remaining amount > 0)
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
      },
    });
    const pendingPaymentsCount = pendingInvoices.length;

    // 6. Recent Bills (Last 10)
    const recentBills = await prisma.invoice.findMany({
      take: 10,
      orderBy: { invoiceDate: 'desc' },
      include: {
        customer: true,
        items: true,
      },
    });

    // 7. Top Customers (By Total Sales from non-cancelled invoices)
    const allInvoices = await prisma.invoice.findMany({
      where: { status: { not: 'CANCELLED' } },
      include: { customer: true },
    });

    const customerSalesMap = new Map<string, { id: string; shopName: string; totalSales: number; ordersCount: number; balance: number }>();
    for (const inv of allInvoices) {
      if (!customerSalesMap.has(inv.customerId)) {
        customerSalesMap.set(inv.customerId, {
          id: inv.customerId,
          shopName: inv.customer.shopName,
          totalSales: 0,
          ordersCount: 0,
          balance: inv.customer.currentOutstandingBalance,
        });
      }
      const data = customerSalesMap.get(inv.customerId)!;
      data.totalSales += inv.grandTotal;
      data.ordersCount += 1;
    }

    const topCustomers = Array.from(customerSalesMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    // 8. Most Sold Products
    const allItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: { status: { not: 'CANCELLED' } },
      },
    });

    const productMap = new Map<string, { id: string; name: string; quantity: number; unit: string; totalAmount: number }>();
    for (const item of allItems) {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          id: item.productId,
          name: item.productName,
          quantity: 0,
          unit: item.unit,
          totalAmount: 0,
        });
      }
      const pData = productMap.get(item.productId)!;
      pData.quantity += item.quantity;
      pData.totalAmount += item.totalPrice;
    }

    const mostSoldProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 9. Customer-wise Outstanding Balance
    const customerOutstandingList = customers
      .filter((c) => c.currentOutstandingBalance > 0)
      .map((c) => ({
        id: c.id,
        shopName: c.shopName,
        ownerName: c.ownerName,
        mobileNumber: c.mobileNumber,
        balance: c.currentOutstandingBalance,
      }))
      .slice(0, 8);

    // 10. Sales Chart: Last 7 Days
    const salesChart: { date: string; sales: number; payments: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayInvs = await prisma.invoice.findMany({
        where: {
          invoiceDate: { gte: dStart, lte: dEnd },
          status: { not: 'CANCELLED' },
        },
      });
      const daySales = dayInvs.reduce((acc, inv) => acc + inv.grandTotal, 0);

      const dayPays = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: dStart, lte: dEnd },
        },
      });
      const dayPaymentsTotal = dayPays.reduce((acc, p) => acc + p.amount, 0);

      salesChart.push({
        date: d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }),
        sales: daySales,
        payments: dayPaymentsTotal,
      });
    }

    return NextResponse.json({
      todaySales,
      todayOrders,
      todayProductsSupplied,
      todayPaymentsReceived,
      totalOutstandingCredit,
      totalCustomers,
      monthlySales,
      monthlyCollection,
      pendingPaymentsCount,
      recentBills,
      topCustomers,
      mostSoldProducts,
      customerOutstandingList,
      salesChart,
    });
  } catch (error: any) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
