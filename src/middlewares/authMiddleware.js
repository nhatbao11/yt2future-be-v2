import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_cua_yt_capital';
/**
 * 1. XÁC THỰC TOKEN
 * Sửa lại để gán 'id' thay vì 'userId' cho khớp với Prisma và Controller
 */
export const verifyToken = (req, res, next) => {
    const token = req.cookies['yt2future_token'];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không tìm thấy phiên đăng nhập. Mời sếp đăng nhập lại!'
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Gán trực tiếp vào req.user để các hàm sau sử dụng
        req.user = {
            id: decoded.id, // Đổi từ userId thành id để đồng bộ toàn hệ thống
            fullName: decoded.fullName,
            avatarUrl: decoded.avatarUrl,
            role: decoded.role
        };
        next();
    }
    catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ!'
        });
    }
};
/**
 * 2. KIỂM TRA QUYỀN ADMIN
 */
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        return res.status(403).json({
            success: false,
            message: 'Cảnh báo: Sếp không có quyền truy cập khu vực này!'
        });
    }
};
/**
 * 3. KIỂM TRA QUYỀN CỘNG TÁC VIÊN HOẶC ADMIN
 * Dùng cho các chức năng đăng bài, upload file
 */
export const isCTVOrAdmin = (req, res, next) => {
    const role = req.user?.role;
    if (req.user && (role === 'ADMIN' || role === 'CTV')) {
        next();
    }
    else {
        return res.status(403).json({
            success: false,
            message: 'Quyền truy cập bị từ chối! Chỉ dành cho Cộng tác viên hoặc Admin.'
        });
    }
};
/**
 * 4. KIỂM TRA CHỈ RIÊNG QUYỀN CTV
 */
export const isCTV = (req, res, next) => {
    if (req.user && req.user.role === 'CTV') {
        next();
    }
    else {
        return res.status(403).json({
            success: false,
            message: 'Sếp cần quyền Cộng tác viên để thực hiện thao tác này!'
        });
    }
};
//# sourceMappingURL=authMiddleware.js.map