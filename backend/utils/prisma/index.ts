import { PrismaClient } from '@prisma/client'

// Global object mein prisma instance save karte hain taake hot-reloading (development) mein masla na ho
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma