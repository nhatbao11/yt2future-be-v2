import express from 'express';
import { getAllCategories, createCategory } from '../controllers/categoryController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';
import { PrismaClient } from '@prisma/client'; // THÊM DÒNG NÀY

const prisma = new PrismaClient(); // KHỞI TẠO BIẾN PRISMA
const router = express.Router();

// 1. Công khai: Ai cũng lấy được danh sách danh mục để lọc bài viết
router.get('/', getAllCategories);

// 2. Bảo mật: Chỉ ADMIN mới được thêm danh mục mới
router.post('/add', verifyToken, isAdmin, createCategory);

// 3. Xóa danh mục
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Đã có prisma ở trên nên lệnh này sẽ chạy mượt
    await prisma.category.delete({
      where: { id: Number(id) }
    });
    res.json({ success: true, message: "Xóa danh mục thành công!" });
  } catch (err) {
    res.status(400).json({ message: "Không thể xóa danh mục đang gắn với báo cáo!" });
  }
});

export default router;