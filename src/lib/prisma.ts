import { PrismaClient } from '@prisma/client';

// Singleton pattern: chỉ tạo 1 PrismaClient duy nhất cho toàn bộ ứng dụng.
// Nhiều instance sẽ làm cạn kiệt connection pool của Supabase (max 60 connections).
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
