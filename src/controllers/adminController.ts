import type { Request, Response } from 'express';
import AuthService from '../services/authService.js';
import rateLimit from 'express-rate-limit';
import { createLog } from '../services/logService.js';
import { PrismaClient, Role } from '@prisma/client'; // Import Role Enum từ Prisma

const prisma = new PrismaClient();

// Giới hạn thao tác Admin để bảo mật
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { message: "Sếp thao tác nhanh quá, bình tĩnh chút!" }
});

// 1. Lấy danh sách User - Cập nhật để lấy thêm roleTitle
export const listUsers = async (req: Request, res: Response) => {
  try {
    // Sếp nên dùng prisma trực tiếp ở đây hoặc cập nhật AuthService để lấy đủ trường
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        role: true,
        roleTitle: true // Thêm trường này để hiển thị "Macro Lead", "Researcher"
      },
      orderBy: { fullName: 'asc' }
    });
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi lấy danh sách nhân sự" });
  }
};

// src/controllers/adminController.ts

// src/controllers/adminController.ts

export const updateRole = async (req: any, res: Response) => {
  const { userId, role } = req.body;
  try {
    const roleTitleMap: Record<string, string> = {
      ADMIN: 'Quản trị viên', CTV: 'Cộng tác viên', MEMBER: 'Hội viên chính thức', USER: 'Thành viên mới'
    };

    // Update đồng thời cả Role và Title trong DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role as Role,
        roleTitle: roleTitleMap[role] || 'Thành viên'
      }
    });

    // Ghi Log lịch sử
    await createLog(req.user, "CẬP NHẬT VAI TRÒ", `Đổi ${updatedUser.email} thành ${role}`);

    res.json({ success: true, user: updatedUser }); // Trả về object đã update
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

// 3. Xóa người dùng - Giữ nguyên logic bảo vệ admin của sếp
export const removeUser = async (req: any, res: Response) => {
  const { id } = req.params;
  const adminId = req.user.userId;

  try {
    const userToDelete = await prisma.user.findUnique({ where: { id } });

    if (!userToDelete) return res.status(404).json({ message: "User không tồn tại" });

    // BẢO VỆ TỐI CAO: Chặn tự xóa hoặc xóa Admin khác
    if (id === adminId) {
      return res.status(400).json({ message: "Sếp không thể tự 'sa thải' chính mình!" });
    }
    if (userToDelete.role === 'ADMIN') {
      return res.status(403).json({ message: "Không thể xóa Admin khác. Hãy hạ cấp họ trước!" });
    }

    await prisma.user.delete({ where: { id } });

    await createLog(req.user, "XÓA NGƯỜI DÙNG", userToDelete.email);

    res.json({ success: true, message: "Đã xóa user vĩnh viễn" });
  } catch (error: any) {
    res.status(400).json({ message: "Lỗi hệ thống khi xóa user" });
  }
};

// 4. Lấy nhật ký hệ thống - Phân trang 5 log
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
      prisma.auditLog.count()
    ]);

    res.json({
      success: true,
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi truy xuất nhật ký" });
  }
};

// 5. Lấy thống kê Dashboard (MỚI)
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalReports, pendingReports, totalCategories] = await Promise.all([
      prisma.user.count(),
      prisma.report.count({ where: { status: 'APPROVED' } }), // Chỉ đếm bài đã duyệt là "Báo cáo đã đăng"
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.category.count()
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalReports,
        pendingReports,
        totalCategories
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thống kê dashboard" });
  }
};