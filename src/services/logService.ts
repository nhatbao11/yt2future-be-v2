// src/services/logService.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createLog = async (admin: any, action: string, target: string) => {
  try {
    // 1. Nếu admin truyền vào thiếu thông tin, ta truy vấn nhanh từ DB
    let adminInfo = admin;
    if (!admin.fullName || !admin.avatarUrl) {
      const dbAdmin = await prisma.user.findUnique({
        where: { id: admin.userId },
        select: { fullName: true, avatarUrl: true }
      });
      if (dbAdmin) {
        adminInfo = { ...admin, ...dbAdmin };
      }
    }

    // 2. Ghi Log vào bảng AuditLog
    await prisma.auditLog.create({
      data: {
        adminId: adminInfo.userId || adminInfo.id,
        adminName: adminInfo.fullName || "Hệ thống",
        adminAvatarUrl: adminInfo.avatarUrl || '/Logo.jpg', // Dashboard sẽ không bị vỡ ảnh
        action: action,
        target: target,
        createdAt: new Date() // Đảm bảo có mốc thời gian để Dashboard sắp xếp
      }
    });

    console.log(`>>> Đã ghi nhật ký: ${action} - ${target}`);
  } catch (error: any) {
    console.error("Lỗi ghi log hệ thống:", error.message);
  }
};