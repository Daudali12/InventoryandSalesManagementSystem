const { prisma } = require('../config/db');

const getAll = async ({ page = 1, limit = 20, search } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { address: { contains: search } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

const getById = async (id) => {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw { status: 404, message: 'Customer not found' };
  return customer;
};

const create = async (data) => {
  return prisma.customer.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  });
};

const update = async (id, data) => {
  await getById(id);
  return prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.address !== undefined && { address: data.address || null }),
    },
  });
};

const remove = async (id) => {
  await getById(id);
  if (await prisma.sale.count({ where: { customerId: id } })) throw { status: 409, message: 'Customer has purchase history and cannot be deleted.' };
  return prisma.customer.delete({ where: { id } });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
