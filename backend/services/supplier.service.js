const { prisma } = require('../config/db');

const getAll = async () => {
  return prisma.supplier.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
};

const getById = async (id) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { products: true },
  });
  if (!supplier) throw { status: 404, message: 'Supplier not found.' };
  return supplier;
};

const create = async (data) => {
  return prisma.supplier.create({
    data: {
      name: data.name,
      company: data.company,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
    },
  });
};

const update = async (id, data) => {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Supplier not found.' };

  return prisma.supplier.update({
    where: { id },
    data: {
      name: data.name,
      company: data.company,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
    },
  });
};

const remove = async (id) => {
  const existing = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw { status: 404, message: 'Supplier not found.' };
  if (existing._count.products > 0) {
    throw { status: 400, message: `Cannot delete supplier. It has ${existing._count.products} product(s) associated.` };
  }

  if (await prisma.purchase.count({ where: { supplierId: id } })) throw { status: 409, message: 'Supplier has purchase orders and cannot be deleted.' };
  await prisma.supplier.delete({ where: { id } });
  return { message: 'Supplier deleted successfully.' };
};

module.exports = { getAll, getById, create, update, remove };