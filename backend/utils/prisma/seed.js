const { prisma } = require('../../config/db');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@inventory.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // 2. Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@inventory.com' },
    update: {},
    create: {
      name: 'Store Manager',
      email: 'manager@inventory.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
    },
  });
  console.log(`✅ Manager user created: ${manager.email}`);

  // 3. Create staff user
  const staffPassword = await bcrypt.hash('staff123', 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@inventory.com' },
    update: {},
    create: {
      name: 'Sales Staff',
      email: 'staff@inventory.com',
      passwordHash: staffPassword,
      role: 'STAFF',
    },
  });
  console.log(`✅ Staff user created: ${staff.email}`);

  // 4. Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: { name: 'Electronics', description: 'Electronic devices and accessories' },
    }),
    prisma.category.upsert({
      where: { name: 'Clothing' },
      update: {},
      create: { name: 'Clothing', description: 'Apparel and fashion items' },
    }),
    prisma.category.upsert({
      where: { name: 'Food & Beverages' },
      update: {},
      create: { name: 'Food & Beverages', description: 'Food items and drinks' },
    }),
    prisma.category.upsert({
      where: { name: 'Office Supplies' },
      update: {},
      create: { name: 'Office Supplies', description: 'Stationery and office equipment' },
    }),
  ]);
  console.log(`✅ ${categories.length} categories created`);

  // 5. Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { name: 'TechWorld Distributors' },
      update: {},
      create: {
        name: 'TechWorld Distributors',
        contactPerson: 'Ahmed Khan',
        email: 'ahmed@techworld.com',
        phone: '+92-321-1234567',
        address: 'Blue Area, Islamabad',
      },
    }),
    prisma.supplier.upsert({
      where: { name: 'Fashion Hub' },
      update: {},
      create: {
        name: 'Fashion Hub',
        contactPerson: 'Sara Ali',
        email: 'sara@fashionhub.com',
        phone: '+92-300-7654321',
        address: 'Liberty Market, Lahore',
      },
    }),
    prisma.supplier.upsert({
      where: { name: 'Office Pro Supplies' },
      update: {},
      create: {
        name: 'Office Pro Supplies',
        contactPerson: 'Usman Raza',
        email: 'usman@officepro.com',
        phone: '+92-333-9876543',
        address: 'Saddar, Karachi',
      },
    }),
  ]);
  console.log(`✅ ${suppliers.length} suppliers created`);

  // 6. Create products
  const products = [
    { name: 'Laptop - Dell Inspiron 15', sku: 'ELEC-001', price: 85000, costPrice: 72000, stockQuantity: 25, lowStockThreshold: 5, categoryId: categories[0].id, supplierId: suppliers[0].id },
    { name: 'Wireless Mouse', sku: 'ELEC-002', price: 1500, costPrice: 900, stockQuantity: 100, lowStockThreshold: 20, categoryId: categories[0].id, supplierId: suppliers[0].id },
    { name: 'USB-C Hub', sku: 'ELEC-003', price: 3500, costPrice: 2200, stockQuantity: 50, lowStockThreshold: 10, categoryId: categories[0].id, supplierId: suppliers[0].id },
    { name: 'Men\'s Formal Shirt', sku: 'CLO-001', price: 2500, costPrice: 1500, stockQuantity: 80, lowStockThreshold: 15, categoryId: categories[1].id, supplierId: suppliers[1].id },
    { name: 'Women\'s Kurta', sku: 'CLO-002', price: 3000, costPrice: 1800, stockQuantity: 60, lowStockThreshold: 10, categoryId: categories[1].id, supplierId: suppliers[1].id },
    { name: 'A4 Paper Ream (500 sheets)', sku: 'OFF-001', price: 800, costPrice: 550, stockQuantity: 200, lowStockThreshold: 30, categoryId: categories[3].id, supplierId: suppliers[2].id },
    { name: 'Ballpoint Pen Pack (10)', sku: 'OFF-002', price: 350, costPrice: 200, stockQuantity: 150, lowStockThreshold: 25, categoryId: categories[3].id, supplierId: suppliers[2].id },
    { name: 'Notebook - Ruled 200 pages', sku: 'OFF-003', price: 250, costPrice: 140, stockQuantity: 3, lowStockThreshold: 20, categoryId: categories[3].id, supplierId: suppliers[2].id },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }
  console.log(`✅ ${products.length} products created`);

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:   admin@inventory.com / admin123');
  console.log('   Manager: manager@inventory.com / manager123');
  console.log('   Staff:   staff@inventory.com / staff123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
