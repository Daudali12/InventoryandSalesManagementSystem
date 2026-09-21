const express = require('express');
const { prisma } = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { money, dateWhere } = require('../utils/domain');
const router = express.Router();
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
router.use(authenticate);
router.get('/analytics', wrap(async (req,res) => {
  const range = dateWhere(req.query);
  const [sales, products, customers, purchases] = await Promise.all([
    prisma.sale.findMany({ where: { ...range, status: 'COMPLETED' }, include: { items: { include: { product: { include: { category: true } } } } }, orderBy: { createdAt: 'asc' } }),
    prisma.product.findMany({ include: { category: true, supplier: true } }),
    prisma.customer.findMany(),
    prisma.purchase.findMany({ where: range, include: { items: true } })
  ]);
  const daily = {}, monthly = {}, categories = {}, best = {};
  let cost = 0; let missingHistoricalCosts = 0;
  for (const s of sales) {
    const day = s.createdAt.toISOString().slice(0,10), month = day.slice(0,7);
    daily[day] = (daily[day] || 0) + s.netAmount; monthly[month] = (monthly[month] || 0) + s.netAmount;
    for (const i of s.items) {
      const revenue = s.totalAmount ? i.subtotal * (s.totalAmount - s.discount) / s.totalAmount : 0;
      const cat = i.product.category?.name || 'Uncategorized'; categories[cat] = (categories[cat] || 0) + revenue;
      best[i.productId] ||= { name: i.product.name, quantity: 0, revenue: 0 }; best[i.productId].quantity += i.quantity; best[i.productId].revenue += revenue;
      if (!i.costRecorded) missingHistoricalCosts++;
      cost += i.costPrice * i.quantity;
    }
  }
  const revenue = money(sales.reduce((n,s) => n + s.netAmount - s.taxAmount, 0));
  const today = new Date().toISOString().slice(0,10);
  const customerReport = customers.map(c => ({ ...c, totalSpending: money(sales.filter(s => s.customerId === c.id).reduce((n,s) => n + s.netAmount,0)), purchases: sales.filter(s => s.customerId === c.id).length }));
  const points = obj => Object.entries(obj).map(([name,value]) => ({ name, value: money(value) }));
  const data = { missingHistoricalCosts, summary: { totalSales: sales.length, todaySales: money(daily[today] || 0), totalProducts: products.length, lowStock: products.filter(p => p.stockQuantity <= p.lowStockThreshold).length, totalCustomers: customers.length, pendingOrders: purchases.filter(p => p.status === 'PENDING').length, monthlyRevenue: money(monthly[today.slice(0,7)] || 0), revenue, profit: money(revenue - cost), cost: money(cost) }, daily: points(daily), monthly: points(monthly), categories: points(categories), productSales: Object.values(best), topProducts: Object.values(best).sort((a,b) => b.quantity - a.quantity).slice(0,10) };
  if (req.user.role !== 'STAFF') Object.assign(data, { sales, products, customers: customerReport, purchases });
  res.json(data);
}));
module.exports = router;
