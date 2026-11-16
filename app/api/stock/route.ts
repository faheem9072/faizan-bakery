import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        stockMovements: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    let lowStockCount = 0;
    const inventory = products.map((p) => {
      const isLow = p.stockTracking && p.currentStock <= p.lowStockThreshold;
      if (isLow) lowStockCount++;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        currentStock: p.currentStock,
        lowStockThreshold: p.lowStockThreshold,
        stockTracking: p.stockTracking,
        isLowStock: isLow,
        stockValueSelling: p.currentStock * p.sellingPrice,
        stockValueCost: p.currentStock * p.costPrice,
        recentMovements: p.stockMovements,
      };
    });

    const filtered = lowStockOnly ? inventory.filter((i) => i.isLowStock) : inventory;

    return NextResponse.json({
      totalProducts: products.length,
      lowStockCount,
      inventory: filtered,
    });
  } catch (error: any) {
    console.error('Stock GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, type = 'PURCHASE_IN', quantity, notes, vendorShopName, unitCost } = body;

    const numQty = parseFloat(quantity);
    if (!productId || isNaN(numQty) || numQty === 0) {
      return NextResponse.json(
        { error: 'Valid product ID and non-zero quantity are required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // If type is PURCHASE_IN, add quantity; if ADJUSTMENT, could be positive or negative
      const newStock = product.currentStock + numQty;

      const updateData: any = { currentStock: newStock };
      if (unitCost && parseFloat(unitCost) > 0) {
        updateData.costPrice = parseFloat(unitCost);
      }
      if (vendorShopName) {
        updateData.vendorShopName = vendorShopName;
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: updateData,
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity: numQty,
          balanceAfter: newStock,
          vendorShopName: vendorShopName || product.vendorShopName || null,
          unitCost: unitCost ? parseFloat(unitCost) : null,
          notes: notes || `Stock updated via ${type}`,
        },
      });

      return { product: updated, movement };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Stock POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

