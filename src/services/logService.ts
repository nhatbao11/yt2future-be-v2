// src/services/logService.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createLog = async (admin: any, action: string, target: string) => {
  // admin.avatarUrl phải được truyền từ token hoặc được lấy từ DB
  await prisma.auditLog.create({
    data: {
      adminId: admin.userId,
      adminName: admin.fullName || "Admin",
      adminAvatarUrl: admin.avatarUrl || null, // Lấy từ thông tin Admin, nếu không có thì null
      action: action,
      target: target
    }
  });
};