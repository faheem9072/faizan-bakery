import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const hasBalance = searchParams.get('hasBalance');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (hasBalance === 'true') {
      where.currentOutstandingBalance = { gt: 0 };
    }
    if (search) {
      where.OR = [
        { shopName: { contains: search } },
        { ownerName: { contains: search } },
        { mobileNumber: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { shopName: 'asc' },
      include: {
        _count: {
          select: {
            invoices: true,
            payments: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Customers GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      shopName,
      ownerName,
      mobileNumber,
      address,
      openingBalance,
      creditLimit,
      notes,
    } = body;

    if (!shopName || !ownerName || !mobileNumber) {
      return NextResponse.json(
        { error: 'Shop Name, Owner Name, and Mobile Number are required' },
        { status: 400 }
      );
    }

    const openBal = parseFloat(openingBalance || 0);

    const customer = await prisma.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({
        data: {
          shopName,
          ownerName,
          mobileNumber,
          address: address || '',
          openingBalance: openBal,
          currentOutstandingBalance: openBal,
          creditLimit: creditLimit ? parseFloat(creditLimit) : null,
          notes: notes || '',
          status: 'ACTIVE',
        },
      });

      if (openBal > 0) {
        await tx.customerTransaction.create({
          data: {
            customerId: newCustomer.id,
            type: 'OPENING_BALANCE',
            debit: openBal,
            credit: 0,
            balanceAfter: openBal,
            description: 'Opening balance brought forward',
          },
        });
      }

      return newCustomer;
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Customers POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

