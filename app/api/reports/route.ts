import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'daily_sales';
    const customerId = searchParams.get('customerId');
    const productId = searchParams.get('productId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    let startDate = startDateParam
      ? new Date(`${startDateParam}T00:00:00.000Z`)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0);
    let endDate = endDateParam
      ? new Date(`${endDateParam}T23:59:59.999Z`)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (reportType) {
      case 'daily_sales': {
        const invoices = await prisma.invoice.findMany({
          where: {
            invoiceDate: { gte: startDate, lte: endDate },
            status: { not: 'CANCELLED' },
            ...(customerId ? { customerId } : {}),
          },
          include: { customer: true, items: true },
          orderBy: { invoiceDate: 'desc' },
        });

        // Group by day
        const dayMap = new Map<string, { date: string; invoiceCount: number; subtotal: number; discount: number; grandTotal: number; collected: number; creditAdded: number }>();
        for (const inv of invoices) {
          const dayKey = inv.invoiceDate.toISOString().slice(0, 10);
          if (!dayMap.has(dayKey)) {
            dayMap.set(dayKey, {
              date: dayKey,
              invoiceCount: 0,
              subtotal: 0,
              discount: 0,
              grandTotal: 0,
              collected: 0,
              creditAdded: 0,
            });
          }
          const row = dayMap.get(dayKey)!;
          row.invoiceCount += 1;
          row.subtotal += inv.subtotal;
          row.discount += inv.discount;
          row.grandTotal += inv.grandTotal;
          row.collected += inv.paidAmount;
          row.creditAdded += inv.remainingAmount;
        }

        const rows = Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date));
        return NextResponse.json({ reportType, rows, totalSales: rows.reduce((s, r) => s + r.grandTotal, 0) });
      }

      case 'weekly_sales': {
        const invoices = await prisma.invoice.findMany({
          where: {
            invoiceDate: { gte: startDate, lte: endDate },
            status: { not: 'CANCELLED' },
            ...(customerId ? { customerId } : {}),
          },
          orderBy: { invoiceDate: 'desc' },
        });

        // Group by ISO week (YYYY-Www)
        const weekMap = new Map<string, { week: string; invoiceCount: number; grandTotal: number; collected: number; credit: number }>();
        for (const inv of invoices) {
          const d = new Date(inv.invoiceDate);
          const onejan = new Date(d.getFullYear(), 0, 1);
          const weekNum = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
          const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

          if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, { week: weekKey, invoiceCount: 0, grandTotal: 0, collected: 0, credit: 0 });
          }
          const w = weekMap.get(weekKey)!;
          w.invoiceCount += 1;
          w.grandTotal += inv.grandTotal;
          w.collected += inv.paidAmount;
          w.credit += inv.remainingAmount;
        }

        const rows = Array.from(weekMap.values()).sort((a, b) => b.week.localeCompare(a.week));
        return NextResponse.json({ reportType, rows });
      }

      case 'monthly_sales': {
        const invoices = await prisma.invoice.findMany({
          where: {
            invoiceDate: { gte: startDate, lte: endDate },
            status: { not: 'CANCELLED' },
            ...(customerId ? { customerId } : {}),
          },
          orderBy: { invoiceDate: 'desc' },
        });

        const monthMap = new Map<string, { month: string; invoiceCount: number; grandTotal: number; collected: number; credit: number }>();
        for (const inv of invoices) {
          const monthKey = inv.invoiceDate.toISOString().slice(0, 7); // YYYY-MM
          if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, { month: monthKey, invoiceCount: 0, grandTotal: 0, collected: 0, credit: 0 });
          }
          const m = monthMap.get(monthKey)!;
          m.invoiceCount += 1;
          m.grandTotal += inv.grandTotal;
          m.collected += inv.paidAmount;
          m.credit += inv.remainingAmount;
        }

        const rows = Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month));
        return NextResponse.json({ reportType, rows });
      }

      case 'customer_wise': {
        const customers = await prisma.customer.findMany({
          where: customerId ? { id: customerId } : {},
          include: {
            invoices: {
              where: {
                invoiceDate: { gte: startDate, lte: endDate },
                status: { not: 'CANCELLED' },
              },
            },
          },
        });

        const rows = customers.map((c) => {
          const totalSales = c.invoices.reduce((acc, i) => acc + i.grandTotal, 0);
          const totalPaid = c.invoices.reduce((acc, i) => acc + i.paidAmount, 0);
          const totalCredit = c.invoices.reduce((acc, i) => acc + i.remainingAmount, 0);

          return {
            customerId: c.id,
            shopName: c.shopName,
            ownerName: c.ownerName,
            mobileNumber: c.mobileNumber,
            invoiceCount: c.invoices.length,
            totalSales,
            totalPaid,
            totalCredit,
            currentOutstanding: c.currentOutstandingBalance,
          };
        }).sort((a, b) => b.totalSales - a.totalSales);

        return NextResponse.json({ reportType, rows });
      }

      case 'product_wise': {
        const items = await prisma.invoiceItem.findMany({
          where: {
            invoice: {
              invoiceDate: { gte: startDate, lte: endDate },
              status: { not: 'CANCELLED' },
              ...(customerId ? { customerId } : {}),
            },
            ...(productId ? { productId } : {}),
          },
          include: { product: true },
        });

        const prodMap = new Map<string, { productId: string; productName: string; unit: string; totalQuantity: number; totalRevenue: number; avgRate: number }>();
        for (const item of items) {
          if (!prodMap.has(item.productId)) {
            prodMap.set(item.productId, {
              productId: item.productId,
              productName: item.productName,
              unit: item.unit,
              totalQuantity: 0,
              totalRevenue: 0,
              avgRate: 0,
            });
          }
          const p = prodMap.get(item.productId)!;
          p.totalQuantity += item.quantity;
          p.totalRevenue += item.totalPrice;
        }

        const rows = Array.from(prodMap.values()).map((p) => ({
          ...p,
          avgRate: p.totalQuantity > 0 ? p.totalRevenue / p.totalQuantity : 0,
        })).sort((a, b) => b.totalRevenue - a.totalRevenue);

        return NextResponse.json({ reportType, rows });
      }

      case 'payments_collection': {
        const payments = await prisma.payment.findMany({
          where: {
            paymentDate: { gte: startDate, lte: endDate },
            ...(customerId ? { customerId } : {}),
          },
          include: { customer: true, invoice: true },
          orderBy: { paymentDate: 'desc' },
        });

        const rows = payments.map((p) => ({
          receiptNumber: p.receiptNumber,
          date: p.paymentDate,
          customer: p.customer.shopName,
          amount: p.amount,
          method: p.paymentMethod,
          ref: p.transactionReference || 'N/A',
          notes: p.notes || '',
        }));

        return NextResponse.json({
          reportType,
          rows,
          totalCollected: payments.reduce((acc, p) => acc + p.amount, 0),
        });
      }

      case 'outstanding_credit': {
        const customers = await prisma.customer.findMany({
          where: {
            currentOutstandingBalance: { gt: 0 },
            ...(customerId ? { id: customerId } : {}),
          },
          orderBy: { currentOutstandingBalance: 'desc' },
          include: {
            invoices: {
              where: { status: { in: ['UNPAID', 'PARTIAL'] } },
            },
          },
        });

        const rows = customers.map((c) => ({
          customerId: c.id,
          shopName: c.shopName,
          ownerName: c.ownerName,
          mobileNumber: c.mobileNumber,
          address: c.address,
          openingBalance: c.openingBalance,
          pendingInvoicesCount: c.invoices.length,
          currentOutstandingBalance: c.currentOutstandingBalance,
          creditLimit: c.creditLimit || 'No Limit',
        }));

        return NextResponse.json({
          reportType,
          rows,
          totalOutstanding: rows.reduce((s, r) => s + r.currentOutstandingBalance, 0),
        });
      }

      case 'invoice_history': {
        const invoices = await prisma.invoice.findMany({
          where: {
            invoiceDate: { gte: startDate, lte: endDate },
            ...(customerId ? { customerId } : {}),
          },
          include: { customer: true, items: true },
          orderBy: { invoiceDate: 'desc' },
        });

        const rows = invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          date: inv.invoiceDate,
          customer: inv.customer.shopName,
          itemsCount: inv.items.length,
          subtotal: inv.subtotal,
          discount: inv.discount,
          grandTotal: inv.grandTotal,
          paidAmount: inv.paidAmount,
          remainingAmount: inv.remainingAmount,
          status: inv.status,
          cancellationReason: inv.cancellationReason || '',
        }));

        return NextResponse.json({ reportType, rows });
      }

      case 'profit_report': {
        // Profit Report (Revenue - Cost Price)
        const items = await prisma.invoiceItem.findMany({
          where: {
            invoice: {
              invoiceDate: { gte: startDate, lte: endDate },
              status: { not: 'CANCELLED' },
              ...(customerId ? { customerId } : {}),
            },
            ...(productId ? { productId } : {}),
          },
          include: { product: true, invoice: true },
        });

        let totalRevenue = 0;
        let totalCost = 0;

        const prodProfitMap = new Map<string, {
          productId: string;
          productName: string;
          unit: string;
          quantity: number;
          sellingPriceAvg: number;
          costPrice: number;
          revenue: number;
          totalCost: number;
          grossProfit: number;
          marginPercent: number;
        }>();

        for (const item of items) {
          const cost = (item.costPrice || item.product.costPrice || 0) * item.quantity;
          const revenue = item.totalPrice;
          totalRevenue += revenue;
          totalCost += cost;

          if (!prodProfitMap.has(item.productId)) {
            prodProfitMap.set(item.productId, {
              productId: item.productId,
              productName: item.productName,
              unit: item.unit,
              quantity: 0,
              sellingPriceAvg: item.unitPrice,
              costPrice: item.costPrice || item.product.costPrice || 0,
              revenue: 0,
              totalCost: 0,
              grossProfit: 0,
              marginPercent: 0,
            });
          }

          const entry = prodProfitMap.get(item.productId)!;
          entry.quantity += item.quantity;
          entry.revenue += revenue;
          entry.totalCost += cost;
          entry.grossProfit = entry.revenue - entry.totalCost;
          entry.marginPercent = entry.revenue > 0 ? (entry.grossProfit / entry.revenue) * 100 : 0;
        }

        const rows = Array.from(prodProfitMap.values()).sort((a, b) => b.grossProfit - a.grossProfit);
        const totalProfit = totalRevenue - totalCost;
        const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return NextResponse.json({
          reportType,
          totalRevenue,
          totalCost,
          totalProfit,
          overallMargin,
          rows,
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Reports GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
