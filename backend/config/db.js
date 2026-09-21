const { PrismaClient } = require('@prisma/client');

// Prisma automatically loads DATABASE_URL from .env via schema.prisma
const prisma = new PrismaClient();

module.exports = { prisma };