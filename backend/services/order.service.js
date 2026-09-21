const { prisma } = require('../config/db');

/**
 * Generate a unique invoice number: ORD-YYYYMMDD-XXXX
 */
const generateInvoiceNumber = async () => {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');

  const prefix = `ORD-${dateStr}-`;

  const lastOrder = await prisma.order.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
  });

  let nextNum = 1;
  if (lastOrder) {
    const lastNum = parseInt(lastOrder.invoiceNumber.split('-').pop());
    nextNum = lastNum + 1;
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
};

const create = async ({ items, userId, paymentMethod = 'CASH', discount = 0, notes }) => {
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
  const orderItems = items.map((item) => {
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

  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const netAmount = totalAmount - discount;

  // Use a transaction to ensure atomicity
  const order = await prisma.$transaction(async (tx) => {
    // 1. Create the order
    const newOrder = await tx.order.create({
      data: {
        invoiceNumber,
        totalAmount,
        discount,
        netAmount,
        paymentMethod,
        userId,
        items: {
          create: orderItems,
        },
      },
      include: { items: { include: { product: true } }, user: { select: { id: true, name: true } } },
    });

    // 2. Deduct stock
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    return newOrder;
  });

  return order;
};

const getAll = async ({ page = 1, limit = 20, status, paymentMethod, startDate, endDate, search }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search } },
    ];
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });

  if (!order) throw { status: 404, message: 'Order not found.' };
  return order;
};

const updateStatus = async (id, paymentMethod) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw { status: 404, message: 'Order not found.' };

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { paymentMethod },
    include: { items: { include: { product: true } }, user: { select: { id: true, name: true } } },
  });

  return updatedOrder;
};

module.exports = { create, getAll, getById, updateStatus };