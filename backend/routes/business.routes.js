const express = require('express');
const { randomUUID, randomBytes, createHash } = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { fail, number, money, lines, totals, dateWhere } = require('../utils/domain');
const router = express.Router();
const admin = authorize('ADMIN', 'MANAGER');
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const activity = (tx, req, action, entityId) => tx.activity.create({ data: { userId: req.user.id, userName: req.user.name || req.user.email, action, entityId } });
const includeProduct = { category: true, supplier: true };
const includeSale = { items: { include: { product: true } }, user: { select: { id: true, name: true } } };
const defaults = { storeName: 'Inventory & Sales Management', storeAddress: '', storePhone: '', storeEmail: '', currency: 'PKR', taxRate: 0, lowStockThreshold: 10 };
const settings = async () => ({ ...defaults, ...(await prisma.setting.findUnique({ where: { id: 'store' } }))?.value });
const pagination = (data, query) => {
  const page = Math.max(1, Number(query.page) || 1), limit = Math.min(10000, Math.max(1, Number(query.limit) || 20));
  return { rows: data.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: data.length, totalPages: Math.max(1, Math.ceil(data.length / limit)) } };
};
// Recovery tokens are delivered via a configured mail gateway, never returned publicly.
router.post('/auth/forgot-password', wrap(async (req, res) => {
  if (!process.env.MAIL_GATEWAY_URL || !process.env.MAIL_GATEWAY_TOKEN) fail('Password recovery email is not configured. Contact your administrator.', 503);
  const user = await prisma.user.findUnique({ where: { email: String(req.body.email || '').trim().toLowerCase() } });
  if (user) {
    const token = randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { resetTokenHash: createHash('sha256').update(token).digest('hex'), resetExpiresAt: new Date(Date.now() + 1800000) } });
    const response = await fetch(process.env.MAIL_GATEWAY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MAIL_GATEWAY_TOKEN}` }, body: JSON.stringify({ to: user.email, subject: 'Reset your password', text: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}` }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) fail('Unable to send recovery email.', 503);
  }
  res.json({ message: 'If the account exists, a password reset link has been emailed.' });
}));
router.post('/auth/recover-password', wrap(async (req, res) => {
  if (typeof req.body.password !== 'string' || req.body.password.length < 8 || typeof req.body.token !== 'string') fail('A valid token and password of at least 8 characters are required.');
  const hash = createHash('sha256').update(req.body.token).digest('hex');
  const changed = await prisma.user.updateMany({ where: { resetTokenHash: hash, resetExpiresAt: { gt: new Date() } }, data: { passwordHash: await bcrypt.hash(req.body.password, 12), resetTokenHash: null, resetExpiresAt: null } });
  if (!changed.count) fail('This reset link is invalid or expired.');
  res.json({ message: 'Password reset. You can now sign in.' });
}));
router.use(authenticate);
router.get('/settings', wrap(async (req, res) => res.json(await settings())));
router.put('/settings', authorize('ADMIN'), wrap(async (req, res) => {
  const value = Object.fromEntries(Object.keys(defaults).map(k => [k, req.body[k] ?? defaults[k]]));
  value.taxRate = number(value.taxRate, 'Tax rate'); value.lowStockThreshold = number(value.lowStockThreshold, 'Stock threshold', true);
  if (value.taxRate > 100 || !['PKR', 'USD', 'EUR'].includes(value.currency) || !String(value.storeName).trim()) fail('Invalid store settings.');
  await prisma.setting.upsert({ where: { id: 'store' }, create: { id: 'store', value }, update: { value } });
  res.json(value);
}));
router.get('/products/low-stock', wrap(async (req, res) => {
  const products = await prisma.product.findMany({ include: includeProduct });
  res.json({ products: products.filter(p => p.stockQuantity <= p.lowStockThreshold) });
}));
router.get('/products', wrap(async (req, res) => {
  const { search, categoryId, supplierId, lowStock, stock } = req.query;
  const where = { ...(categoryId && { categoryId }), ...(supplierId && { supplierId }), ...(search && { OR: [{ name: { contains: search } }, { sku: { contains: search } }] }) };
  let products = await prisma.product.findMany({ where, include: includeProduct, orderBy: { createdAt: 'desc' } });
  if (lowStock === 'true') products = products.filter(p => p.stockQuantity <= p.lowStockThreshold);
  if (stock === 'out') products = products.filter(p => p.stockQuantity === 0);
  if (stock === 'normal') products = products.filter(p => p.stockQuantity > p.lowStockThreshold);
  const result = pagination(products, req.query);
  res.json({ products: result.rows, pagination: result.pagination });
}));
router.get('/products/:id', wrap(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { ...includeProduct, stockMovements: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } } } });
  if (!product) fail('Product not found.', 404);
  res.json({ product });
}));
const productData = body => {
  if (!body.name?.trim()) fail('Product name is required.');
  if (body.imageUrl && !/^(https?:\/\/|data:image\/(png|jpeg|webp);base64,)/.test(body.imageUrl)) fail('Use a PNG, JPEG, WebP or HTTP image URL.');
  return { name: body.name.trim(), sku: body.sku?.trim() || `SKU-${randomUUID().slice(0,8)}`, description: body.description || '', imageUrl: body.imageUrl || null, categoryId: body.categoryId || null, supplierId: body.supplierId || null, price: number(body.price, 'Price'), costPrice: number(body.costPrice, 'Cost'), stockQuantity: number(body.stockQuantity, 'Stock', true), lowStockThreshold: number(body.lowStockThreshold ?? 10, 'Minimum stock', true) };
};
router.post('/products', authorize('ADMIN'), wrap(async (req, res) => {
  const data = productData(req.body);
  const product = await prisma.$transaction(async tx => {
    const p = await tx.product.create({ data, include: includeProduct });
    await tx.stockMovement.create({ data: { productId: p.id, userId: req.user.id, type: 'IN', quantity: p.stockQuantity, reason: 'Opening stock' } });
    await activity(tx, req, `Added product ${p.name}`, p.id); return p;
  });
  res.status(201).json({ product });
}));
router.put('/products/:id', authorize('ADMIN'), wrap(async (req, res) => {
  const product = await prisma.$transaction(async tx => {
    const old = await tx.product.findUnique({ where: { id: req.params.id } }); if (!old) fail('Product not found.', 404);
    const data = productData({ ...old, ...req.body });
    const changed = await tx.product.updateMany({ where: { id: old.id, stockQuantity: old.stockQuantity }, data });
    if (!changed.count) fail('Stock changed. Refresh and try again.', 409);
    if (data.stockQuantity !== old.stockQuantity) await tx.stockMovement.create({ data: { productId: old.id, userId: req.user.id, type: 'ADJUSTMENT', quantity: data.stockQuantity - old.stockQuantity, reason: 'Product stock edited' } });
    await activity(tx, req, `Updated product ${old.name}`, old.id);
    return tx.product.findUnique({ where: { id: old.id }, include: includeProduct });
  }); res.json({ product });
}));
router.delete('/products/:id', authorize('ADMIN'), wrap(async (req, res) => {
  await prisma.$transaction(async tx => {
    if (await tx.purchaseItem.count({ where: { productId: req.params.id } })) fail('Product is linked to a purchase and cannot be deleted.', 409);
    const product = await tx.product.findUnique({ where: { id: req.params.id } }); if (!product) fail('Product not found.', 404);
    await tx.product.delete({ where: { id: product.id } });
    await activity(tx, req, `Deleted product ${product.name}`, product.id);
  }); res.json({ success: true });
}));
router.post('/products/:id/stock', wrap(async (req, res) => {
  const { type, reason } = req.body; const quantity = number(req.body.quantity, 'Quantity', true);
  if (!['IN', 'OUT', 'ADJUSTMENT', 'DAMAGED'].includes(type) || (!quantity && type !== 'ADJUSTMENT') || !reason?.trim()) fail('Select a movement type, quantity and reason.');
  const result = await prisma.$transaction(async tx => {
    const old = await tx.product.findUnique({ where: { id: req.params.id } }); if (!old) fail('Product not found.', 404);
    const delta = type === 'ADJUSTMENT' ? quantity - old.stockQuantity : (type === 'IN' ? quantity : -quantity);
    if (old.stockQuantity + delta < 0) fail('Insufficient stock.');
    const changed = await tx.product.updateMany({ where: { id: old.id, stockQuantity: old.stockQuantity }, data: { stockQuantity: { increment: delta } } });
    if (!changed.count) fail('Stock changed. Refresh and try again.', 409);
    const stockMovement = await tx.stockMovement.create({ data: { productId: old.id, userId: req.user.id, type, quantity: type === 'ADJUSTMENT' ? delta : quantity, reason } });
    await activity(tx, req, `${type}: ${old.name} (${delta})`, old.id);
    return { product: await tx.product.findUnique({ where: { id: old.id } }), stockMovement };
  }); res.json(result);
}));
router.post('/sales', wrap(async (req, res) => {
  const items = lines(req.body.items); const paymentMethod = req.body.paymentMethod || 'CASH';
  if (!['CASH', 'CARD', 'ONLINE'].includes(paymentMethod)) fail('Invalid payment method.');
  const config = await settings();
  const sale = await prisma.$transaction(async tx => {
    const products = await tx.product.findMany({ where: { id: { in: items.map(i => i.productId) } } });
    if (products.length !== items.length) fail('A product no longer exists.');
    const saleItems = items.map(i => { const p = products.find(p => p.id === i.productId); return { productId: p.id, quantity: Number(i.quantity), unitPrice: p.price, costPrice: p.costPrice, costRecorded: true, subtotal: money(p.price * i.quantity) }; });
    const amounts = totals(saleItems.reduce((n, i) => n + i.subtotal, 0), req.body.discount ?? 0, config.taxRate);
    if (req.body.taxRate != null && Number(req.body.taxRate) !== config.taxRate) fail('Tax settings changed. Reload the POS before checkout.', 409);
    if (paymentMethod === 'CASH' && number(req.body.receivedAmount ?? amounts.netAmount, 'Cash received') < amounts.netAmount) fail('Cash received is less than the total.');
    let customer = null;
    if (req.body.customerId) { customer = await tx.customer.findUnique({ where: { id: req.body.customerId } }); if (!customer) fail('Customer not found.'); }
    const invoiceNumber = `INV-${Date.now()}-${randomUUID().slice(0,6)}`;
    for (const item of saleItems.sort((a,b) => a.productId.localeCompare(b.productId))) {
      const changed = await tx.product.updateMany({ where: { id: item.productId, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
      if (!changed.count) fail('Insufficient stock. Refresh the catalog.', 409);
      await tx.stockMovement.create({ data: { productId: item.productId, type: 'OUT', quantity: item.quantity, reason: `Sale: ${invoiceNumber}`, userId: req.user.id } });
    }
    const sale = await tx.sale.create({ data: { ...amounts, invoiceNumber, paymentMethod, customerId: customer?.id, customerName: customer?.name || req.body.customerName, customerPhone: customer?.phone || req.body.customerPhone, notes: req.body.notes, userId: req.user.id, items: { create: saleItems } }, include: includeSale });
    await activity(tx, req, `Completed sale ${invoiceNumber}`, sale.id); return sale;
  }); res.status(201).json({ sale });
}));
router.put('/sales/:id/cancel', admin, wrap(async (req, res) => {
  const sale = await prisma.$transaction(async tx => {
    const changed = await tx.sale.updateMany({ where: { id: req.params.id, status: 'COMPLETED' }, data: { status: 'CANCELLED' } });
    if (!changed.count) fail('Sale not found or already cancelled.', 409);
    const sale = await tx.sale.findUnique({ where: { id: req.params.id }, include: includeSale });
    for (const item of sale.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      await tx.stockMovement.create({ data: { productId: item.productId, type: 'IN', quantity: item.quantity, reason: `Cancelled ${sale.invoiceNumber}`, userId: req.user.id } });
    }
    await activity(tx, req, `Cancelled sale ${sale.invoiceNumber}`, sale.id); return sale;
  }); res.json({ sale });
}));
router.post('/sales/:id/invoice', wrap(async (req, res) => {
  const sale = await prisma.sale.findUnique({ where: { id: req.params.id } }); if (!sale) fail('Sale not found.', 404);
  await activity(prisma, req, `Generated invoice ${sale.invoiceNumber}`, sale.id); res.json({ success: true });
}));
router.get('/purchases', admin, wrap(async (req, res) => {
  const { search, supplierId, status, paymentStatus } = req.query;
  const purchases = await prisma.purchase.findMany({ where: { ...dateWhere(req.query), ...(supplierId && { supplierId }), ...(status && { status }), ...(paymentStatus && { paymentStatus }), ...(search && { OR: [{ invoiceNumber: { contains: search } }, { supplierName: { contains: search } }] }) }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  res.json({ purchases });
}));
router.post('/purchases', admin, wrap(async (req, res) => {
  const items = lines(req.body.items); const supplier = await prisma.supplier.findUnique({ where: { id: req.body.supplierId || '' } }); if (!supplier) fail('Select a supplier.');
  const products = await prisma.product.findMany({ where: { id: { in: items.map(i => i.productId) } } }); if (products.length !== items.length) fail('Product not found.');
  const paymentStatus = req.body.paymentStatus || 'UNPAID'; if (!['UNPAID', 'PARTIAL', 'PAID'].includes(paymentStatus)) fail('Invalid payment status.');
  const purchaseDate = new Date(req.body.purchaseDate || Date.now()); if (Number.isNaN(purchaseDate.getTime())) fail('Invalid purchase date.');
  const rows = items.map(i => ({ productId: i.productId, productName: products.find(p => p.id === i.productId).name, quantity: Number(i.quantity), unitCost: number(i.unitCost, 'Unit cost'), subtotal: money(Number(i.unitCost) * i.quantity) }));
  const purchase = await prisma.$transaction(async tx => {
    const p = await tx.purchase.create({ data: { invoiceNumber: `PO-${Date.now()}-${randomUUID().slice(0,6)}`, supplierId: supplier.id, supplierName: supplier.name, paymentStatus, purchaseDate, totalAmount: money(rows.reduce((n,i) => n + i.subtotal, 0)), userId: req.user.id, items: { create: rows } }, include: { items: true } });
    await activity(tx, req, `Created purchase ${p.invoiceNumber}`, p.id); return p;
  }); res.status(201).json({ purchase });
}));
router.put('/purchases/:id', admin, wrap(async (req, res) => {
  const { status, paymentStatus } = req.body;
  if (status && !['RECEIVED', 'CANCELLED'].includes(status)) fail('Invalid purchase status.');
  if (paymentStatus && !['UNPAID', 'PARTIAL', 'PAID'].includes(paymentStatus)) fail('Invalid payment status.');
  const purchase = await prisma.$transaction(async tx => {
    if (status) {
      const changed = await tx.purchase.updateMany({ where: { id: req.params.id, status: 'PENDING' }, data: { status } });
      if (!changed.count) fail('Only a pending purchase can be received or cancelled.', 409);
    }
    const p = await tx.purchase.findUnique({ where: { id: req.params.id }, include: { items: true } }); if (!p) fail('Purchase not found.', 404);
    if (status === 'RECEIVED') for (const i of p.items) {
      await tx.product.update({ where: { id: i.productId }, data: { stockQuantity: { increment: i.quantity }, costPrice: i.unitCost, supplierId: p.supplierId } });
      await tx.stockMovement.create({ data: { productId: i.productId, type: 'IN', quantity: i.quantity, reason: `Purchase received: ${p.invoiceNumber}`, userId: req.user.id } });
    }
    await activity(tx, req, `${status || 'Payment updated'} purchase ${p.invoiceNumber}`, p.id);
    return tx.purchase.update({ where: { id: p.id }, data: { ...(paymentStatus && { paymentStatus }) }, include: { items: true } });
  }); res.json({ purchase });
}));
router.get('/customers/:id/history', admin, wrap(async (req, res) => {
  const sales = await prisma.sale.findMany({ where: { customerId: req.params.id }, include: includeSale, orderBy: { createdAt: 'desc' } });
  res.json({ sales, totalSpending: money(sales.filter(s => s.status === 'COMPLETED').reduce((n,s) => n + s.netAmount, 0)) });
}));
router.get('/activity', admin, wrap(async (req, res) => res.json({ activities: await prisma.activity.findMany({ where: { ...dateWhere(req.query), ...(req.query.search && { action: { contains: req.query.search } }) }, orderBy: { createdAt: 'desc' }, take: 1000 }) })));
router.get('/notifications', wrap(async (req, res) => {
  const products = await prisma.product.findMany();
  const recent = await prisma.activity.findMany({ where: { OR: [{ action: { startsWith: 'Completed sale' } }, { action: { startsWith: 'RECEIVED purchase' } }] }, orderBy: { createdAt: 'desc' }, take: 10 });
  res.json({ notifications: [...products.filter(p => p.stockQuantity <= p.lowStockThreshold).map(p => ({ id: p.id, message: `${p.name} is low in stock (${p.stockQuantity} remaining).`, href: '/inventory?lowStock=true' })), ...recent.map(a => ({ id: a.id, message: a.action, href: a.action.startsWith('Completed') ? '/sales' : '/purchases' }))] });
}));
router.get('/users', authorize('ADMIN'), wrap(async (req, res) => res.json({ users: await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } }) })));
router.post('/users', authorize('ADMIN'), wrap(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || typeof password !== 'string' || password.length < 8 || !['ADMIN', 'STAFF', 'MANAGER'].includes(role)) fail('Provide a name, email, role and password of at least 8 characters.');
  const user = await prisma.user.create({ data: { name: name.trim(), email: email.trim().toLowerCase(), role, passwordHash: await bcrypt.hash(password, 12) }, select: { id: true, name: true, email: true, role: true } });
  await activity(prisma, req, `Added ${role} account ${user.name}`, user.id); res.status(201).json({ user });
}));
module.exports = { router, activity, settings };
