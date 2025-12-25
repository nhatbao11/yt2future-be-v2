// src/controllers/adminController.ts
import type { Request, Response } from 'express';
import AuthService from '../services/authService.js';
import rateLimit from 'express-rate-limit';
import { createLog } from '../services/logService.js';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { message: "Sếp thao tác nhanh quá, bình tĩnh chút!" }
});

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await AuthService.getAllUsers();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi lấy danh sách user" });
  }
};

export const updateRole = async (req: any, res: Response) => {
  const { userId, role } = req.body;
  const admin = req.user; // Thông tin sếp đang thực hiện

  try {
    // 1. Lấy thông tin user trước khi sửa để biết email/tên
    const userToUpdate = await AuthService.getMe(userId);

    // 2. Thực hiện cập nhật trong Database
    await AuthService.updateUser(userId, { role });

    // 3. GHI LOG: Hành động này cực kỳ quan trọng để theo dõi phân quyền
    // Cấu trúc: createLog(người_thực_hiện, hành_động, đối_tượng_bị_tác_động)
    await createLog(
      admin,
      "CẬP NHẬT VAI TRÒ",
      `Thay đổi ${userToUpdate.email} thành ${role}`
    );

    res.json({
      success: true,
      message: `Đã nâng cấp ${userToUpdate.fullName} lên ${role} thành công!`
    });
  } catch (error: any) {
    res.status(400).json({ message: "Lỗi cập nhật quyền hạn hoặc ghi log" });
  }
};

// export const removeUser = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   try {
//     await AuthService.deleteUser(id);
//     res.json({ success: true, message: "Đã xóa user thành công" });
//   } catch (error: any) {
//     res.status(400).json({ message: "Không thể xóa user" });
//   }
// };


// export const removeUser = async (req: Request, res: Response) => {
//   const { id } = req.params;

//   // 1. Kiểm tra nếu id không tồn tại
//   if (!id) {
//     return res.status(400).json({ message: "Thiếu ID người dùng cần xóa!" });
//   }

//   try {
//     // 2. Lúc này id chắc chắn là string, gọi service thoải mái
//     await AuthService.deleteUser(id);
//     res.json({ success: true, message: "Đã xóa user thành công" });
//   } catch (error: any) {
//     res.status(400).json({ message: "Không thể xóa user" });
//   }
// };

export const removeUser = async (req: any, res: Response) => {
  const { id } = req.params;
  const adminId = req.user.userId; // ID của sếp đang thực hiện lệnh xóa

  try {
    const userToDelete = await AuthService.getMe(id);

    // BẢO VỆ TỐI CAO: Không được tự xóa chính mình hoặc xóa Admin khác
    if (id === adminId) {
      return res.status(400).json({ message: "Sếp không thể tự 'sa thải' chính mình!" });
    }
    if (userToDelete.role === 'ADMIN') {
      return res.status(403).json({ message: "Không thể xóa một Admin khác. Hãy hạ cấp họ xuống Member trước!" });
    }

    await AuthService.deleteUser(id);

    // Ghi log vào DB (Giả định sếp có bảng AuditLog)
    // await prisma.auditLog.create({ data: { adminId, action: `Xóa user ${userToDelete.email}` } });
    await createLog(req.user, "XÓA NGƯỜI DÙNG", userToDelete.email);

    res.json({ success: true, message: "Đã xóa user thành công" });
  } catch (error: any) {
    res.status(400).json({ message: "Không tìm thấy user hoặc lỗi hệ thống" });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 5; // Sếp muốn 5 log mỗi trang
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
    res.status(500).json({ message: "Lỗi lấy nhật ký" });
  }
};