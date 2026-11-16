import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        stockMovements: {
          orderBy: { date: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
      sourceType,
      vendorShopName,
      isActive,
    } = body;

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If stock was manually adjusted here
      if (currentStock !== undefined && parseFloat(currentStock) !== existing.currentStock) {
        const diff = parseFloat(currentStock) - existing.currentStock;
        await tx.stockMovement.create({
          data: {
            productId: params.id,
            type: 'ADJUSTMENT',
            quantity: diff,
            balanceAfter: parseFloat(currentStock),
            notes: 'Manual inventory adjustment via product edit',
          },
        });
      }

      return tx.product.update({
        where: { id: params.id },
        data: {
          name: name !== undefined ? name : existing.name,
          category: category !== undefined ? category : existing.category,
          unit: unit !== undefined ? unit : existing.unit,
          sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : existing.sellingPrice,
          costPrice: costPrice !== undefined ? parseFloat(costPrice) : existing.costPrice,
          defaultQuantity: defaultQuantity !== undefined ? parseFloat(defaultQuantity) : existing.defaultQuantity,
          currentStock: currentStock !== undefined ? parseFloat(currentStock) : existing.currentStock,
          lowStockThreshold: lowStockThreshold !== undefined ? parseFloat(lowStockThreshold) : existing.lowStockThreshold,
          stockTracking: stockTracking !== undefined ? stockTracking : existing.stockTracking,
          sourceType: sourceType !== undefined ? sourceType : existing.sourceType,
          vendorShopName: vendorShopName !== undefined ? vendorShopName : existing.vendorShopName,
          isActive: isActive !== undefined ? isActive : existing.isActive,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Soft delete / deactivate to preserve historical sales reports
    const deactivated = await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Product deactivated successfully', product: deactivated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

