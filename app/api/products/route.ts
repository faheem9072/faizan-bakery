import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sourceType = searchParams.get('sourceType') || '';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }
    if (category && category !== 'All') {
      where.category = category;
    }
    if (sourceType && sourceType !== 'All') {
      where.sourceType = sourceType;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
        { vendorShopName: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      unit,
      sellingPrice,
      costPrice,
      defaultQuantity,
      currentStock,
      lowStockThreshold,
      stockTracking,
      sourceType = 'IN_HOUSE',
      vendorShopName = '',
    } = body;

    if (!name || sellingPrice === undefined) {
      return NextResponse.json({ error: 'Name and Selling Price are required' }, { status: 400 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          category: category || 'Bakery',
          unit: unit || 'piece',
          sellingPrice: parseFloat(sellingPrice),
          costPrice: parseFloat(costPrice || 0),
          defaultQuantity: parseFloat(defaultQuantity || 1),
          currentStock: parseFloat(currentStock || 0),
          lowStockThreshold: parseFloat(lowStockThreshold || 10),
          stockTracking: stockTracking !== false,
          sourceType: sourceType === 'OUTSIDE_PURCHASE' ? 'OUTSIDE_PURCHASE' : 'IN_HOUSE',
          vendorShopName: vendorShopName || null,
          isActive: true,
        },
      });

      if (parseFloat(currentStock || 0) > 0) {
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            type: 'OPENING',
            quantity: parseFloat(currentStock),
            balanceAfter: parseFloat(currentStock),
            notes: 'Initial opening stock',
          },
        });
      }

      return newProduct;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

