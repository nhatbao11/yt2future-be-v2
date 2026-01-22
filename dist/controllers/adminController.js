import AuthService from '../services/authService.js';
import rateLimit from 'express-rate-limit';
import { createLog } from '../services/logService.js';
import { PrismaClient, Role } from '@prisma/client'; // Import Role Enum từ Prisma
const prisma = new PrismaClient();
// Giới hạn thao tác Admin để bảo mật
export const adminLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: (req) => ({ message: req.t('admin.rateLimitExceeded') })
});
// 1. Lấy danh sách User - Cập nhật để lấy thêm roleTitle
export const listUsers = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: req.t('user.listError') });
    }
};
// src/controllers/adminController.ts
// src/controllers/adminController.ts
export const updateRole = async (req, res) => {
    const { userId, role } = req.body;
    try {
        const roleTitleMap = {
            ADMIN: 'Quản trị viên', CTV: 'Cộng tác viên', MEMBER: 'Hội viên chính thức', USER: 'Thành viên mới'
        };
        // Update đồng thời cả Role và Title trong DB
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                role: role,
                roleTitle: roleTitleMap[role] || 'Thành viên'
            }
        });
        // Ghi Log lịch sử
        const logDetail = req.t('admin.roleUpdated', { email: updatedUser.email, role });
        await createLog(req.user, "CẬP NHẬT VAI TRÒ", logDetail);
        res.json({ success: true, user: updatedUser, message: req.t('user.roleUpdated') }); // Trả về object đã update
    }
    catch (error) {
        res.status(400).json({ success: false });
    }
};
// 3. Xóa người dùng - Giữ nguyên logic bảo vệ admin của sếp
export const removeUser = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.userId;
    try {
        const userToDelete = await prisma.user.findUnique({ where: { id } });
        if (!userToDelete)
            return res.status(404).json({ message: req.t('user.userNotExists') });
        // BẢO VỆ TỐI CAO: Chặn tự xóa hoặc xóa Admin khác
        if (id === adminId) {
            return res.status(400).json({ message: req.t('user.cannotDeleteSelf') });
        }
        if (userToDelete.role === 'ADMIN') {
            return res.status(403).json({ message: req.t('user.cannotDeleteAdmin') });
        }
        await prisma.user.delete({ where: { id } });
        const logDetail = req.t('admin.userDeleted', { email: userToDelete.email });
        await createLog(req.user, "XÓA NGƯỜI DÙNG", logDetail);
        res.json({ success: true, message: req.t('success.deleted') });
    }
    catch (error) {
        res.status(400).json({ message: req.t('user.deleteError') });
    }
};
// 4. Lấy nhật ký hệ thống - Phân trang 5 log
export const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
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
    }
    catch (error) {
        res.status(500).json({ message: req.t('admin.logsError') });
    }
};
// 5. Lấy thống kê Dashboard (MỚI)
export const getDashboardStats = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: req.t('admin.statsError') });
    }
};
//# sourceMappingURL=adminController.js.map