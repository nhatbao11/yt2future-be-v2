import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { verifyToken, isAdmin, isCTVOrAdmin } from '../middlewares/authMiddleware.js';
// XOÁ DÒNG IMPORT MULTER ĐI SẾP
const router = express.Router();
// 1. ROUTE CÔNG KHAI
router.get('/public', reportController.getPublicReports);
// 2. ROUTE QUẢN LÝ: Danh sách cho Admin
router.get('/admin-list', verifyToken, isAdmin, reportController.getAllReportsAdmin);
// 3. ROUTE DUYỆT BÀI
router.post('/review', verifyToken, isAdmin, reportController.reviewReport);
// 4. ROUTE THÊM BÀI: ĐÃ FIX ĐỂ KHÔNG BỊ LỖI UNEXPECTED END
router.post('/add', verifyToken, isCTVOrAdmin, // Cho phép cả CTV và Admin đăng bài
// BỎ CÁI upload.fields(...) CỦA MULTER ĐI
reportController.createReport);
// 5. ROUTE SỬA/XÓA
router.delete('/:id', verifyToken, isAdmin, reportController.deleteReport);
router.put('/:id', verifyToken, isCTVOrAdmin, reportController.updateReport);
export default router;
//# sourceMappingURL=reportRoutes.js.map