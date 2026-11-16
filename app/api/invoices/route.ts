import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date'); // YYYY-MM-DD
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }
    if (status) {
      where.status = status;
    }
    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      where.invoiceDate = { gte: dayStart, lte: dayEnd };
    } else if (startDate && endDate) {
      where.invoiceDate = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { shopName: { contains: search } } },
        { customer: { ownerName: { contains: search } } },
        { customer: { mobileNumber: { contains: search } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      take: 100,
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Invoices GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      items, // array of { productId, quantity, unitPrice }
      discount = 0,
      paidAmount = 0,
      paymentMethod = 'CASH',
      notes = '',
      createdById,
    } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invoice must contain at least one product' }, { status: 400 });
    }

    // Run within atomic database transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Fetch customer & settings
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new Error('Customer not found');
      }

      const settings = await tx.businessSetting.findUnique({
        where: { id: 'default' },
      });
      const prefix = settings?.invoicePrefix || 'FZ-';
      const allowNegative = settings?.allowNegativeStock ?? true;

      // 2. Fetch all products to validate prices, stock, and calculate subtotal
      const productIds = Array.from(
        new Set(items.map((i: any) => (Array.isArray(i.productId) ? String(i.productId[0]) : String(i.productId))))
      );
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      let subtotal = 0;
      const preparedItems: any[] = [];

      for (const item of items) {
        const prodId = Array.isArray(item.productId) ? String(item.productId[0]) : String(item.productId);
        const prod = productMap.get(prodId);
        if (!prod) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        const qty = parseFloat(item.quantity);
        if (qty <= 0) {
          throw new Error(`Invalid quantity for ${prod.name}`);
        }

        // Allow negotiated custom wholesale price if provided, else standard sellingPrice
        const unitPrice = item.unitPrice !== undefined && item.unitPrice !== null
          ? parseFloat(item.unitPrice)
          : prod.sellingPrice;

        const lineTotal = qty * unitPrice;
        subtotal += lineTotal;

        // Check stock
        if (prod.stockTracking && !allowNegative && prod.currentStock < qty) {
          throw new Error(`Insufficient stock for ${prod.name}. Available: ${prod.currentStock} ${prod.unit}, Requested: ${qty}`);
        }

        preparedItems.push({
          productId: prod.id,
          productName: prod.name,
          unit: prod.unit,
          quantity: qty,
          unitPrice,
          totalPrice: lineTotal,
          costPrice: prod.costPrice,
          sourceType: prod.sourceType || 'IN_HOUSE',
          vendorShopName: prod.vendorShopName || null,
        });
      }

      const numDiscount = Math.max(0, parseFloat(discount || 0));
      const grandTotal = Math.max(0, subtotal - numDiscount);
      const numPaid = Math.max(0, parseFloat(paidAmount || 0));
      const remainingAmount = Math.max(0, grandTotal - numPaid);

      // Determine invoice status
      let invoiceStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
      if (numPaid >= grandTotal) {
        invoiceStatus = 'PAID';
      } else if (numPaid > 0) {
        invoiceStatus = 'PARTIAL';
      }

      // 3. Generate sequential unique invoice number
      const currentYear = new Date().getFullYear();
      const countThisYear = await tx.invoice.count({
        where: {
          invoiceDate: {
            gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          },
        },
      });
      const seqNumber = String(countThisYear + 1).padStart(4, '0');
      const invoiceNumber = `${prefix}${currentYear}-${seqNumber}`;

      const previousBalance = customer.currentOutstandingBalance;
      const totalOutstandingAfter = previousBalance + (grandTotal - numPaid);

      // 4. Create Invoice Record
      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId,
          subtotal,
          discount: numDiscount,
          grandTotal,
          paidAmount: numPaid,
          remainingAmount,
          previousBalance,
          totalOutstandingAfter,
          status: invoiceStatus,
          paymentMethod: numPaid > 0 ? paymentMethod : 'CREDIT',
          notes,
          createdById,
          items: {
            create: preparedItems,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 5. Update Product Stocks and Record Stock Movements
      for (const item of preparedItems) {
        const prod = productMap.get(item.productId)!;
        if (prod.stockTracking) {
          const newStock = prod.currentStock - item.quantity;
          await tx.product.update({
            where: { id: prod.id },
            data: { currentStock: newStock },
          });

          await tx.stockMovement.create({
            data: {
              productId: prod.id,
              type: 'SALE_OUT',
              quantity: -item.quantity,
              balanceAfter: newStock,
              referenceId: createdInvoice.id,
              notes: `Supplied to ${customer.shopName} (Inv #${invoiceNumber})`,
            },
          });
        }
      }

      // 6. Record Customer Debit Transaction (Sales Invoice)
      const balanceAfterSale = previousBalance + grandTotal;
      await tx.customerTransaction.create({
        data: {
          customerId: customer.id,
          type: 'INVOICE',
          referenceId: createdInvoice.id,
          referenceNumber: invoiceNumber,
          debit: grandTotal,
          credit: 0,
          balanceAfter: balanceAfterSale,
          description: `Sales Bill #${invoiceNumber} (${preparedItems.length} items)`,
        },
      });

      // 7. If paidAmount > 0, record Payment and Credit Transaction
      if (numPaid > 0) {
        const paymentCount = await tx.payment.count();
        const receiptNumber = `REC-${currentYear}-${String(paymentCount + 1).padStart(4, '0')}`;

        await tx.payment.create({
          data: {
            receiptNumber,
            customerId: customer.id,
            invoiceId: createdInvoice.id,
            amount: numPaid,
            paymentMethod,
            notes: `Payment for Bill #${invoiceNumber}`,
            createdById,
          },
        });

        await tx.customerTransaction.create({
          data: {
            customerId: customer.id,
            type: 'PAYMENT',
            referenceId: createdInvoice.id,
            referenceNumber: receiptNumber,
            debit: 0,
            credit: numPaid,
            balanceAfter: totalOutstandingAfter,
            description: `Payment received via ${paymentMethod} (Receipt #${receiptNumber})`,
          },
        });
      }

      // 8. Update Customer Outstanding Balance Atomically
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          currentOutstandingBalance: totalOutstandingAfter,
        },
      });

      return createdInvoice;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Invoice Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 400 });
  }
}

