const { prisma } = require('../config/db');

const createCategory = async (name) => {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw new Error('Category already exists.');
  return await prisma.category.create({ data: { name } });
};

const getAllCategories = async () => {
  return await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });
};

const generateSKU = () => `PROD-${Math.floor(100000 + Math.random() * 900000)}`;

const createProduct = async (data) => {
  const sku = data.sku && data.sku.trim() !== '' ? data.sku : generateSKU();
  const existingSKU = await prisma.product.findUnique({ where: { sku } });
  if (existingSKU) throw new Error('Product with this SKU already exists.');

  return await prisma.product.create({
    data: {
      sku,
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      costPrice: parseFloat(data.costPrice),
      stockQuantity: parseInt(data.stockQuantity, 10),
      lowStockThreshold: data.lowStockThreshold ? parseInt(data.lowStockThreshold, 10) : 10,
      categoryId: data.categoryId,
    },
    include: { category: true },
  });
};

const getAllProducts = async (searchQuery) => {
  const whereClause = searchQuery
    ? {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { sku: { contains: searchQuery, mode: 'insensitive' } },
      ],
    }
    : {};

  return await prisma.product.findMany({
    where: whereClause,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) throw new Error('Product not found.');
  return product;
};

const updateProduct = async (id, data) => {
  await getProductById(id);
  return await prisma.product.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price && { price: parseFloat(data.price) }),
      ...(data.costPrice && { costPrice: parseFloat(data.costPrice) }),
      ...(data.stockQuantity !== undefined && { stockQuantity: parseInt(data.stockQuantity, 10) }),
      ...(data.lowStockThreshold !== undefined && { lowStockThreshold: parseInt(data.lowStockThreshold, 10) }),
      ...(data.categoryId && { categoryId: data.categoryId }),
    },
    include: { category: true },
  });
};

const deleteProduct = async (id) => {
  await getProductById(id);
  return await prisma.product.delete({ where: { id } });
};

const getLowStockAlerts = async () => {
  const products = await prisma.product.findMany({ include: { category: true } });
  return products.filter((item) => item.stockQuantity <= item.lowStockThreshold);
};

module.exports = {
  createCategory,
  getAllCategories,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockAlerts,
};