import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.businessSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.businessSetting.create({
        data: {
          id: 'default',
          businessName: 'FAIZAN BAKERY',
          tagline: 'Wholesale & Daily Distribution',
          address: 'Main Road, Market Complex, Opp. Bus Stand',
          mobileNumber: '+91 98765 43210',
          gstNumber: '32ABCDE1234F1Z5',
          invoicePrefix: 'FZ-',
          currency: '₹',
          thermalPrinterWidth: '58mm',
          upiId: 'faizanbakery@upi',
          upiName: 'Faizan Bakery',
          allowNegativeStock: true,
          invoiceFooterNote: 'Thank you for your business! Fresh & Sweet Daily.',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      businessName,
      tagline,
      address,
      mobileNumber,
      gstNumber,
      invoicePrefix,
      currency,
      thermalPrinterWidth,
      upiId,
      upiName,
      allowNegativeStock,
      invoiceFooterNote,
    } = body;

    const updated = await prisma.businessSetting.upsert({
      where: { id: 'default' },
      update: {
        businessName,
        tagline,
        address,
        mobileNumber,
        gstNumber,
        invoicePrefix,
        currency,
        thermalPrinterWidth,
        upiId,
        upiName,
        allowNegativeStock,
        invoiceFooterNote,
      },
      create: {
        id: 'default',
        businessName: businessName || 'FAIZAN BAKERY',
        tagline,
        address,
        mobileNumber,
        gstNumber,
        invoicePrefix: invoicePrefix || 'FZ-',
        currency: currency || '₹',
        thermalPrinterWidth: thermalPrinterWidth || '58mm',
        upiId: upiId || 'faizanbakery@upi',
        upiName: upiName || 'Faizan Bakery',
        allowNegativeStock: allowNegativeStock ?? true,
        invoiceFooterNote: invoiceFooterNote || 'Thank you for your business!',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
