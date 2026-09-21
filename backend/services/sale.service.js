const { prisma } = require('../config/db');

/**
 * Generate a unique invoice number: INV-YYYYMMDD-XXXX
 */
const generateInvoiceNumber = async () => {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');

  const prefix = `INV-${dateStr}-`;

  const lastSale = await prisma.sale.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
  });

  let nextNum = 1;
  if (lastSale) {
    const lastNum = parseInt(lastSale.invoiceNumber.split('-').pop());
    nextNum = lastNum + 1;
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
};

const create = async ({ items, customerName, customerPhone, notes, userId, discount = 0 }) => {
  if (!items || items.length === 0) {
    throw { status: 400, message: 'At least one item is required.' };
  }

  // Validate all products exist and have sufficient stock
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw { status: 400, message: 'One or more products not found.' };
  }

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (product.stockQuantity < item.quantity) {
      throw {
        status: 400,
        message: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
      };
    }
  }

  const invoiceNumber = await generateInvoiceNumber();

  // Calculate totals
  const saleItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const unitPrice = parseFloat(product.price);
    const subtotal = unitPrice * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    };
  });

  const totalAmount = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
  const netAmount = totalAmount - discount;

  // Use a transaction to ensure atomicity
  const sale = await prisma.$transaction(async (tx) => {
    // 1. Create the sale
    const newSale = await tx.sale.create({
      data: {
        invoiceNumber,
        totalAmount,
        discount,
        netAmount,
        customerName,
        customerPhone,
        notes,
        userId,
        items: {
          create: saleItems,
        },
      },
      include: { items: { include: { product: true } }, user: { select: { id: true, name: true } } },
    });

    // 2. Deduct stock and create stock movements
    for (const item of saleItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          reason: `Sale: ${invoiceNumber}`,
          userId,
        },
      });
    }

    return newSale;
  });

  return sale;
};

const getAll = async ({ page = 1, limit = 20, status, startDate, endDate, search, paymentMethod }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search } },
      { customerName: { contains: search } },
    ];
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    sales,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getById = async (id) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });

  if (!sale) throw { status: 404, message: 'Sale not found.' };
  return sale;
};

const cancel = async (id, userId) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!sale) throw { status: 404, message: 'Sale not found.' };
  if (sale.status === 'CANCELLED') throw { status: 400, message: 'Sale is already cancelled.' };

  // Restore stock in a transaction
  const updatedSale = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.sale.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: { include: { product: true } }, user: { select: { id: true, name: true } } },
    });

    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reason: `Sale cancelled: ${sale.invoiceNumber}`,
          userId,
        },
      });
    }

    return cancelled;
  });

  return updatedSale;
};

module.exports = { create, getAll, getById, cancel };