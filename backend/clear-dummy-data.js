const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('Clearing dummy data...');

    // Delete in reverse order of dependencies to avoid foreign key constraints
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});

    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});

    await prisma.stockMovement.deleteMany({});

    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.supplier.deleteMany({});

    // We intentionally keep the Users so the user can still log in.
    console.log('Dummy data cleared successfully! Users were preserved.');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
