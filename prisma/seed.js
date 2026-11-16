const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Faizan Bakery Database ---');

  // 1. Business Settings
  await prisma.businessSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
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
  console.log('✓ Business Settings initialized');

  // 2. Users
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Faizan Ahmed (Owner)',
      role: 'ADMIN',
      pin: '1234',
    },
  });

  await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      name: 'Bilal (Delivery Van 1)',
      role: 'STAFF',
      pin: '1234',
    },
  });
  console.log('✓ Users initialized (admin / staff)');

  // 3. Initial Products as specified in requirements
  const initialProducts = [
    { name: 'Laddu', category: 'Sweets', unit: 'kg', sellingPrice: 240, costPrice: 180, defaultQuantity: 5, currentStock: 85, lowStockThreshold: 15 },
    { name: 'Jalebi', category: 'Sweets', unit: 'kg', sellingPrice: 220, costPrice: 160, defaultQuantity: 5, currentStock: 60, lowStockThreshold: 10 },
    { name: 'Cake', category: 'Cakes', unit: 'piece', sellingPrice: 350, costPrice: 260, defaultQuantity: 10, currentStock: 45, lowStockThreshold: 10 },
    { name: 'Egg Cake', category: 'Cakes', unit: 'piece', sellingPrice: 28, costPrice: 20, defaultQuantity: 20, currentStock: 250, lowStockThreshold: 30 },
    { name: 'Coconut Cake', category: 'Cakes', unit: 'piece', sellingPrice: 32, costPrice: 22, defaultQuantity: 20, currentStock: 180, lowStockThreshold: 25 },
    { name: 'Halwa', category: 'Halwa', unit: 'kg', sellingPrice: 280, costPrice: 210, defaultQuantity: 5, currentStock: 90, lowStockThreshold: 15 },
    { name: 'Karutha Halwa', category: 'Halwa', unit: 'kg', sellingPrice: 320, costPrice: 240, defaultQuantity: 5, currentStock: 70, lowStockThreshold: 15 },
    { name: 'Pachha Halwa', category: 'Halwa', unit: 'kg', sellingPrice: 320, costPrice: 240, defaultQuantity: 5, currentStock: 65, lowStockThreshold: 15 },
    { name: 'Mixture', category: 'Snacks', unit: 'kg', sellingPrice: 200, costPrice: 150, defaultQuantity: 5, currentStock: 110, lowStockThreshold: 20, sourceType: 'IN_HOUSE' },
    { name: 'Varthakka', category: 'Snacks', unit: 'packet', sellingPrice: 45, costPrice: 32, defaultQuantity: 15, currentStock: 140, lowStockThreshold: 25, sourceType: 'IN_HOUSE' },
    { name: 'Special Tea Rusk', category: 'Biscuits', unit: 'packet', sellingPrice: 60, costPrice: 45, defaultQuantity: 10, currentStock: 80, lowStockThreshold: 15, sourceType: 'OUTSIDE_PURCHASE', vendorShopName: 'Calicut Rusk Wholesale' },
    { name: 'Banana Chips', category: 'Snacks', unit: 'packet', sellingPrice: 70, costPrice: 50, defaultQuantity: 10, currentStock: 60, lowStockThreshold: 15, sourceType: 'OUTSIDE_PURCHASE', vendorShopName: 'Malabar Chips & Sweets' },
  ];

  for (const prod of initialProducts) {
    const existing = await prisma.product.findFirst({ where: { name: prod.name } });
    if (!existing) {
      const created = await prisma.product.create({ data: prod });
      // Create initial stock movement
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: 'OPENING',
          quantity: prod.currentStock,
          balanceAfter: prod.currentStock,
          notes: 'Initial opening stock',
        },
      });
    }
  }
  console.log(`✓ 10 Initial Products initialized with stock movements`);

  // 4. Initial Customers
  const initialCustomers = [
    {
      shopName: 'Shahi Bakery',
      ownerName: 'Mohammad Shafi',
      mobileNumber: '+91 98460 12345',
      address: 'Market Road, Town Center',
      openingBalance: 10000,
      currentOutstandingBalance: 10000,
      creditLimit: 50000,
      notes: 'Morning wholesale delivery route (Route 1)',
    },
    {
      shopName: 'Cookies Bakery',
      ownerName: 'Abdul Rahman',
      mobileNumber: '+91 98460 54321',
      address: 'Junction Corner, Near Old Bridge',
      openingBalance: 6000,
      currentOutstandingBalance: 6000,
      creditLimit: 30000,
      notes: 'Specializes in tea-time cakes & halwa',
    },
    {
      shopName: 'Al-Madina Bakes & Sweets',
      ownerName: 'Basheer Ahmed',
      mobileNumber: '+91 98460 98765',
      address: 'Bypass Highway, Near Petrol Pump',
      openingBalance: 4500,
      currentOutstandingBalance: 4500,
      creditLimit: 25000,
      notes: 'Evening delivery stop (Route 2)',
    },
    {
      shopName: 'Royal Tea & Bakery',
      ownerName: 'Salman Khan',
      mobileNumber: '+91 98460 33445',
      address: 'Railway Station Square',
      openingBalance: 8200,
      currentOutstandingBalance: 8200,
      creditLimit: 40000,
      notes: 'High volume laddu & jalebi order every morning',
    },
  ];

  for (const cust of initialCustomers) {
    const existing = await prisma.customer.findFirst({ where: { shopName: cust.shopName } });
    if (!existing) {
      const created = await prisma.customer.create({ data: cust });
      if (cust.openingBalance > 0) {
        await prisma.customerTransaction.create({
          data: {
            customerId: created.id,
            type: 'OPENING_BALANCE',
            debit: cust.openingBalance,
            credit: 0,
            balanceAfter: cust.openingBalance,
            description: 'Opening balance carried forward from paper ledger',
          },
        });
      }
    }
  }
  console.log(`✓ Initial Customers initialized with ledger history`);

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

