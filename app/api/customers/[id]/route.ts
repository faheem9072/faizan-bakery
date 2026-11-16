import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          take: 50,
          include: {
            items: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 50,
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 100,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Customer GET [id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      shopName,
      ownerName,
      mobileNumber,
      address,
      creditLimit,
      notes,
      status,
    } = body;

    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        shopName: shopName !== undefined ? shopName : existing.shopName,
        ownerName: ownerName !== undefined ? ownerName : existing.ownerName,
        mobileNumber: mobileNumber !== undefined ? mobileNumber : existing.mobileNumber,
        address: address !== undefined ? address : existing.address,
        creditLimit: creditLimit !== undefined ? (creditLimit ? parseFloat(creditLimit) : null) : existing.creditLimit,
        notes: notes !== undefined ? notes : existing.notes,
        status: status !== undefined ? status : existing.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Customer PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: { status: 'INACTIVE' },
    });

    return NextResponse.json({ message: 'Customer deactivated successfully', customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

