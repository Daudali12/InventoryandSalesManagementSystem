const { prisma } = require('../config/db');

const getAll = async () => {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
};

const getById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { products: true },
  });
  if (!category) throw { status: 404, message: 'Category not found.' };
  return category;
};

const create = async ({ name, description }) => {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw { status: 400, message: 'Category with this name already exists.' };

  return prisma.category.create({ data: { name, description } });
};

const update = async (id, { name, description }) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Category not found.' };

  if (name && name !== existing.name) {
    const nameExists = await prisma.category.findUnique({ where: { name } });
    if (nameExists) throw { status: 400, message: 'Category with this name already exists.' };
  }

  return prisma.category.update({
    where: { id },
    data: { name, description },
  });
};

const remove = async (id) => {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw { status: 404, message: 'Category not found.' };
  if (existing._count.products > 0) {
    throw { status: 400, message: `Cannot delete category. It has ${existing._count.products} product(s) associated.` };
  }

  await prisma.category.delete({ where: { id } });
  return { message: 'Category deleted successfully.' };
};

module.exports = { getAll, getById, create, update, remove };