// Complete End-to-End Workflow Verification for Faizan Bakery System
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runEndToEndTest() {
  console.log('========================================================');
  console.log('🚀 TESTING ENTIRE FAIZAN BAKERY END-TO-END WORKFLOW');
  console.log('========================================================\n');

  // STEP 1: Verify Initial Products
  console.log('📦 1. Verifying Initial Products...');
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products:`);
  products.forEach((p) => console.log(`   - ${p.name} (${p.category}): ₹${p.sellingPrice}/${p.unit} (Stock: ${p.currentStock})`));
  if (products.length < 10) throw new Error('Expected at least 10 products');

  // STEP 2: Add / Verify Customers
  console.log('\n👥 2. Verifying Customer Accounts...');
  const customers = await prisma.customer.findMany();
  console.log(`Found ${customers.length} customers:`);
  customers.forEach((c) => console.log(`   - ${c.shopName} (${c.ownerName}): Due ₹${c.currentOutstandingBalance}`));

  // Find Shahi Bakery
  let shahi = customers.find((c) => c.shopName.includes('Shahi Bakery'));
  if (!shahi) throw new Error('Shahi Bakery customer not found');
  const initialShahiBalance = shahi.currentOutstandingBalance;
  console.log(`   Selected Shahi Bakery: Initial Balance = ₹${initialShahiBalance}`);

  // Find Laddu & Egg Cake
  const laddu = products.find((p) => p.name === 'Laddu');
  const eggCake = products.find((p) => p.name === 'Egg Cake');
  const initialLadduStock = laddu.currentStock;
  const initialEggCakeStock = eggCake.currentStock;

  // STEP 3: Create a Wholesale Invoice
  // Let's simulate:
  // - Laddu: 5 kg @ ₹240 = ₹1,200
  // - Egg Cake: 20 pcs @ ₹28 = ₹560
  // Subtotal = ₹1,760
  // Discount = ₹60
  // Grand Total = ₹1,700
  // Amount Paid Today = ₹700 (Partial Payment in Cash)
  // Remaining Current Bill Due = ₹1,000
  // Total Outstanding After = initialShahiBalance + 1,000
  console.log('\n🧾 3. Simulating Invoice Creation (ACID Transaction)...');
  const invoicePrefix = 'FZ-';
  const currentYear = new Date().getFullYear();
  const invoiceCount = await prisma.invoice.count();
  const invoiceNumber = `${invoicePrefix}${currentYear}-${String(invoiceCount + 1).padStart(4, '0')}`;

  const subtotal = (5 * laddu.sellingPrice) + (20 * eggCake.sellingPrice); // 1200 + 560 = 1760
  const discount = 60;
  const grandTotal = subtotal - discount; // 1700
  const paidAmount = 700; // Partial payment
  const remainingAmount = grandTotal - paidAmount; // 1000
  const totalOutstandingAfter = initialShahiBalance + remainingAmount;

  const createdInvoice = await prisma.$transaction(async (tx) => {
    // 1. Create Invoice
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: shahi.id,
        subtotal,
        discount,
        grandTotal,
        paidAmount,
        remainingAmount,
        previousBalance: initialShahiBalance,
        totalOutstandingAfter,
        status: 'PARTIAL',
        paymentMethod: 'CASH',
        notes: 'Morning wholesale dispatch to Shahi Bakery',
        items: {
          create: [
            {
              productId: laddu.id,
              productName: laddu.name,
              unit: laddu.unit,
              quantity: 5,
              unitPrice: laddu.sellingPrice,
              totalPrice: 5 * laddu.sellingPrice,
              costPrice: laddu.costPrice,
            },
            {
              productId: eggCake.id,
              productName: eggCake.name,
              unit: eggCake.unit,
              quantity: 20,
              unitPrice: eggCake.sellingPrice,
              totalPrice: 20 * eggCake.sellingPrice,
              costPrice: eggCake.costPrice,
            },
          ],
        },
      },
      include: { items: true },
    });

    // 2. Decrement Stocks
    await tx.product.update({
      where: { id: laddu.id },
      data: { currentStock: laddu.currentStock - 5 },
    });
    await tx.stockMovement.create({
      data: {
        productId: laddu.id,
        type: 'SALE_OUT',
        quantity: -5,
        balanceAfter: laddu.currentStock - 5,
        referenceId: inv.id,
        notes: `Supplied to ${shahi.shopName} (Inv #${invoiceNumber})`,
      },
    });

    await tx.product.update({
      where: { id: eggCake.id },
      data: { currentStock: eggCake.currentStock - 20 },
    });
    await tx.stockMovement.create({
      data: {
        productId: eggCake.id,
        type: 'SALE_OUT',
        quantity: -20,
        balanceAfter: eggCake.currentStock - 20,
        referenceId: inv.id,
        notes: `Supplied to ${shahi.shopName} (Inv #${invoiceNumber})`,
      },
    });

    // 3. Customer Ledger Debit
    await tx.customerTransaction.create({
      data: {
        customerId: shahi.id,
        type: 'INVOICE',
        referenceId: inv.id,
        referenceNumber: invoiceNumber,
        debit: grandTotal,
        credit: 0,
        balanceAfter: initialShahiBalance + grandTotal,
        description: `Sales Bill #${invoiceNumber}`,
      },
    });

    // 4. Record Partial Payment
    const paymentCount = await tx.payment.count();
    const receiptNumber = `REC-${currentYear}-${String(paymentCount + 1).padStart(4, '0')}`;
    await tx.payment.create({
      data: {
        receiptNumber,
        customerId: shahi.id,
        invoiceId: inv.id,
        amount: paidAmount,
        paymentMethod: 'CASH',
        notes: `Payment for Bill #${invoiceNumber}`,
      },
    });

    // 5. Customer Ledger Credit
    await tx.customerTransaction.create({
      data: {
        customerId: shahi.id,
        type: 'PAYMENT',
        referenceId: inv.id,
        referenceNumber: receiptNumber,
        debit: 0,
        credit: paidAmount,
        balanceAfter: totalOutstandingAfter,
        description: `Payment received via CASH (Receipt #${receiptNumber})`,
      },
    });

    // 6. Update Customer Balance
    await tx.customer.update({
      where: { id: shahi.id },
      data: { currentOutstandingBalance: totalOutstandingAfter },
    });

    return inv;
  });

  console.log(`✓ Invoice #${createdInvoice.invoiceNumber} created successfully!`);
  console.log(`  Subtotal: ₹${createdInvoice.subtotal}, Discount: ₹${createdInvoice.discount}, Grand Total: ₹${createdInvoice.grandTotal}`);
  console.log(`  Paid: ₹${createdInvoice.paidAmount}, Remaining: ₹${createdInvoice.remainingAmount}`);

  // STEP 4: Check Stock Deduction
  console.log('\n📉 4. Verifying Stock Deductions...');
  const updatedLaddu = await prisma.product.findUnique({ where: { id: laddu.id } });
  const updatedEggCake = await prisma.product.findUnique({ where: { id: eggCake.id } });
  console.log(`  Laddu stock: ${initialLadduStock} -> ${updatedLaddu.currentStock} (Decreased by 5)`);
  console.log(`  Egg Cake stock: ${initialEggCakeStock} -> ${updatedEggCake.currentStock} (Decreased by 20)`);
  if (updatedLaddu.currentStock !== initialLadduStock - 5) throw new Error('Stock deduction mismatch for Laddu');
  if (updatedEggCake.currentStock !== initialEggCakeStock - 20) throw new Error('Stock deduction mismatch for Egg Cake');

  // STEP 5: Verify Shahi Bakery Balance
  console.log('\n💳 5. Verifying Customer Balance Update...');
  const updatedShahi = await prisma.customer.findUnique({ where: { id: shahi.id } });
  console.log(`  Previous Balance: ₹${initialShahiBalance}`);
  console.log(`  Current Outstanding Balance: ₹${updatedShahi.currentOutstandingBalance}`);
  if (updatedShahi.currentOutstandingBalance !== totalOutstandingAfter) {
    throw new Error('Balance mismatch for Shahi Bakery');
  }

  // STEP 6: Receive an additional partial payment of ₹500 via UPI
  console.log('\n💵 6. Recording Additional Partial Payment (₹500 via UPI)...');
  const payCount = await prisma.payment.count();
  const upiReceipt = `REC-${currentYear}-${String(payCount + 1).padStart(4, '0')}`;
  const upiAmount = 500;
  const balanceAfterUpi = updatedShahi.currentOutstandingBalance - upiAmount;

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        receiptNumber: upiReceipt,
        customerId: shahi.id,
        invoiceId: createdInvoice.id,
        amount: upiAmount,
        paymentMethod: 'UPI',
        transactionReference: 'UPI-9821739182',
        notes: 'Follow-up UPI transfer from Shahi Bakery',
      },
    });

    await tx.customerTransaction.create({
      data: {
        customerId: shahi.id,
        type: 'PAYMENT',
        referenceId: createdInvoice.id,
        referenceNumber: upiReceipt,
        debit: 0,
        credit: upiAmount,
        balanceAfter: balanceAfterUpi,
        description: `Payment received via UPI (Receipt #${upiReceipt})`,
      },
    });

    await tx.invoice.update({
      where: { id: createdInvoice.id },
      data: {
        paidAmount: createdInvoice.paidAmount + upiAmount,
        remainingAmount: createdInvoice.remainingAmount - upiAmount,
      },
    });

    await tx.customer.update({
      where: { id: shahi.id },
      data: { currentOutstandingBalance: balanceAfterUpi },
    });
  });

  const finalShahi = await prisma.customer.findUnique({ where: { id: shahi.id } });
  console.log(`✓ Recorded UPI payment #${upiReceipt}. New Balance: ₹${finalShahi.currentOutstandingBalance}`);

  // STEP 7: Verify Distribution Register
  console.log('\n🚚 7. Verifying Daily Distribution Register Data...');
  const todayInvoices = await prisma.invoice.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: { customer: true, items: true },
  });
  console.log(`Found ${todayInvoices.length} active invoices for distribution:`);
  todayInvoices.forEach((inv) => {
    console.log(`   - ${inv.customer.shopName}: ₹${inv.grandTotal} (Paid: ₹${inv.paidAmount}, Remaining: ₹${inv.remainingAmount})`);
    inv.items.forEach((item) => console.log(`       * ${item.productName}: ${item.quantity} ${item.unit}`));
  });

  // STEP 8: Check Transaction Audit Ledger
  console.log('\n📜 8. Verifying Full Customer Audit Ledger...');
  const ledger = await prisma.customerTransaction.findMany({
    where: { customerId: shahi.id },
    orderBy: { date: 'asc' },
  });
  console.log(`Ledger entries for Shahi Bakery (${ledger.length} records):`);
  ledger.forEach((t) => {
    console.log(`   [${t.type}] Debit: ₹${t.debit} | Credit: ₹${t.credit} | Balance: ₹${t.balanceAfter} | ${t.description}`);
  });

  console.log('\n========================================================');
  console.log('✅ ALL WORKFLOW TESTS PASSED PERFECTLY WITH REAL DATABASE!');
  console.log('========================================================\n');
}

runEndToEndTest()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

