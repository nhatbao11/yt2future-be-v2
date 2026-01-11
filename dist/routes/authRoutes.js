import { Router } from 'express'; // Thêm Response vào đây
import { PrismaClient } from '@prisma/client'; // Thêm Prisma để chạy lệnh update
import { register, login, getMe, logout, grantGoogleRole } from '../controllers/authController.js';
import { isAdmin, verifyToken } from '../middlewares/authMiddleware.js';
import * as feedbackController from '../controllers/feedbackController.js';
const prisma = new PrismaClient(); // Khởi tạo prisma
const router = Router();
// --- Các route cơ bản ---
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/grant-google-role', grantGoogleRole);
// --- Route thông tin cá nhân ---
router.get('/me', verifyToken, getMe);
/**
 * ROUTE CẬP NHẬT HỒ SƠ
 * Next.js sẽ gọi đến đây để lưu Tên và URL ảnh từ Cloudinary
 */
router.put('/update-user', verifyToken, async (req, res) => {
    try {
        const { fullName, avatarUrl } = req.body; // Đây là cái URL text mà Cloudinary cấp
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id }, // Middleware verifyToken đã gán id vào req.user
            data: {
                fullName: fullName || undefined, // Chỉ update nếu có gửi lên
                avatarUrl: avatarUrl || undefined // Lưu cái link ảnh mây vào cột avatarUrl
            }
        });
        res.json({
            success: true,
            message: "Đã cập nhật hồ sơ thành công sếp ơi!",
            user: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                avatarUrl: updatedUser.avatarUrl // Trả về để FE cập nhật UI ngay
            }
        });
    }
    catch (error) {
        console.error("Lỗi Prisma Update:", error.message);
        res.status(500).json({
            success: false,
            message: "Lỗi cập nhật DB sếp ơi!",
            error: error.message
        });
    }
});
// --- Các route khác ---
router.get('/admin', verifyToken, isAdmin, (req, res) => {
    res.json({ message: "Dữ liệu mật cho Admin" });
});
router.post('/send', verifyToken, feedbackController.sendFeedback);
export default router;
//# sourceMappingURL=authRoutes.js.map