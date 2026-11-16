import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD

    const targetDate = dateParam ? new Date(`${dateParam}T00:00:00.000Z`) : new Date();
    const dayStart = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0));
    const dayEnd = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));

    // Invoices for this date
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
      orderBy: { invoiceDate: 'asc' },
    });

    let totalDaySales = 0;
    let totalDayCollected = 0;
    let totalDayCreditAdded = 0;
    let totalItemsDispatched = 0;

    // Customer deliveries grouping
    const customerDeliveries = invoices.map((inv) => {
      totalDaySales += inv.grandTotal;
      totalDayCollected += inv.paidAmount;
      totalDayCreditAdded += inv.remainingAmount;

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customer: {
          id: inv.customer.id,
          shopName: inv.customer.shopName,
          ownerName: inv.customer.ownerName,
          mobileNumber: inv.customer.mobileNumber,
          address: inv.customer.address,
        },
        items: inv.items.map((i) => {
          totalItemsDispatched += i.quantity;
          return {
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          };
        }),
        subtotal: inv.subtotal,
        discount: inv.discount,
        grandTotal: inv.grandTotal,
        paidAmount: inv.paidAmount,
        creditAdded: inv.remainingAmount,
        status: inv.status,
      };
    });

    // Product-wise distribution aggregation
    const productAggregationMap = new Map<string, {
      productId: string;
      productName: string;
      unit: string;
      totalQuantity: number;
      totalAmount: number;
      shopsCount: number;
      shops: Set<string>;
    }>();

    for (const inv of invoices) {
      for (const item of inv.items) {
        if (!productAggregationMap.has(item.productId)) {
          productAggregationMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            unit: item.unit,
            totalQuantity: 0,
            totalAmount: 0,
            shopsCount: 0,
            shops: new Set(),
          });
        }
        const record = productAggregationMap.get(item.productId)!;
        record.totalQuantity += item.quantity;
        record.totalAmount += item.totalPrice;
        record.shops.add(inv.customer.shopName);
      }
    }

    const productSummaries = Array.from(productAggregationMap.values()).map((p) => ({
      productId: p.productId,
      productName: p.productName,
      unit: p.unit,
      totalQuantity: p.totalQuantity,
      totalAmount: p.totalAmount,
      shopsCount: p.shops.size,
      shopNames: Array.from(p.shops),
    })).sort((a, b) => b.totalQuantity - a.totalQuantity);

    return NextResponse.json({
      date: dayStart.toISOString().slice(0, 10),
      summary: {
        totalShopsVisited: customerDeliveries.length,
        totalSales: totalDaySales,
        totalCollected: totalDayCollected,
        totalCreditAdded: totalDayCreditAdded,
        totalItemsDispatched,
      },
      customerDeliveries,
      productSummaries,
    });
  } catch (error: any) {
    console.error('Distribution GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
