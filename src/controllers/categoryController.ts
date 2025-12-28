import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createLog } from '../services/logService.js'; // Đường dẫn tới file log của sếp

const prisma = new PrismaClient();

// 1. Lấy tất cả danh mục (Dùng cho bộ lọc ở FE)
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể lấy danh mục!" });
  }
};

// 2. Tạo danh mục mới (Chỉ dành cho ADMIN)
export const createCategory = async (req: any, res: Response) => {
  try {
    const { name, slug } = req.body;

    // Kiểm tra xem slug đã tồn tại chưa để tránh crash DB
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ message: "Slug này đã tồn tại sếp ơi!" });
    }

    const cat = await prisma.category.create({
      data: { name, slug }
    });

    // Ghi lại nhật ký: Admin nào đã thêm danh mục gì
    if (req.user) {
      await createLog(req.user, "THÊM DANH MỤC", name);
    }

    res.json({ success: true, category: cat });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Lỗi tạo danh mục!",
      error: error.message
    });
  }
};