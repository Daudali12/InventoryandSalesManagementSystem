const { prisma } = require('../config/db');

const getDashboard = async () => {
  const [
    totalProducts,
    totalCategories,
    totalSuppliers,
    totalUsers,
    allProducts,
    recentSales,
    salesStats,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.supplier.count(),
    prisma.user.count(),
    prisma.product.findMany({ select: { id: true, stockQuantity: true, lowStockThreshold: true, price: true, costPrice: true } }),
    prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      where: { status: 'COMPLETED' },
      include: {
        user: { select: { name: true } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.sale.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  const lowStockProducts = allProducts.filter((p) => p.stockQuantity <= p.lowStockThreshold);
  const totalStockValue = allProducts.reduce(
    (sum, p) => sum + parseFloat(p.costPrice) * p.stockQuantity,
    0
  );

  return {
    summary: {
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalUsers,
      lowStockCount: lowStockProducts.length,
      totalSales: salesStats._count,
      totalRevenue: parseFloat(salesStats._sum.totalAmount || 0),
      totalStockValue: Math.round(totalStockValue * 100) / 100,
    },
    recentSales: recentSales.map((sale) => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      totalAmount: sale.totalAmount,
      itemCount: sale.items.reduce((sum, item) => sum + item.quantity, 0),
      soldBy: sale.user.name,
      createdAt: sale.createdAt,
    })),
  };
};

const getSalesReport = async ({ period = 'daily', startDate, endDate }) => {
  const where = { status: 'COMPLETED' };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
  } else {
    // Default: last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    where.createdAt = { gte: thirtyDaysAgo };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: { include: { product: { select: { id: true, name: true, sku: true, costPrice: true } } } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Summary
  const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
  const totalCost = sales.reduce((sum, s) => {
    return (
      sum +
      s.items.reduce((itemSum, item) => itemSum + parseFloat(item.product.costPrice) * item.quantity, 0)
    );
  }, 0);
  const totalProfit = totalRevenue - totalCost;

  // Top selling products
  const productSales = {};
  for (const sale of sales) {
    for (const item of sale.items) {
      const key = item.productId;
      if (!productSales[key]) {
        productSales[key] = {
          productId: item.productId,
          name: item.product.name,
          sku: item.product.sku,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      productSales[key].totalQuantity += item.quantity;
      productSales[key].totalRevenue += parseFloat(item.subtotal);
    }
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  return {
    period,
    totalSales: sales.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0,
    topProducts,
    sales,
  };
};

const getInventoryReport = async () => {
  const products = await prisma.product.findMany({
    include: { category: true, supplier: true },
    orderBy: { stockQuantity: 'asc' },
  });

  const lowStock = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
  const outOfStock = products.filter((p) => p.stockQuantity === 0);

  const totalStockValue = products.reduce(
    (sum, p) => sum + parseFloat(p.costPrice) * p.stockQuantity,
    0
  );
  const totalRetailValue = products.reduce(
    (sum, p) => sum + parseFloat(p.price) * p.stockQuantity,
    0
  );

  // Group by category
  const byCategory = {};
  for (const product of products) {
    const catName = product.category?.name || 'Uncategorized';
    if (!byCategory[catName]) {
      byCategory[catName] = { count: 0, stockValue: 0, totalQuantity: 0 };
    }
    byCategory[catName].count++;
    byCategory[catName].stockValue += parseFloat(product.costPrice) * product.stockQuantity;
    byCategory[catName].totalQuantity += product.stockQuantity;
  }

  return {
    totalProducts: products.length,
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    totalRetailValue: Math.round(totalRetailValue * 100) / 100,
    potentialProfit: Math.round((totalRetailValue - totalStockValue) * 100) / 100,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStockProducts: lowStock,
    outOfStockProducts: outOfStock,
    byCategory,
  };
};

module.exports = { getDashboard, getSalesReport, getInventoryReport };