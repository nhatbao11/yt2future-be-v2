import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 1. Người dùng gửi feedback
export const sendFeedback = async (req: any, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId; // Lấy từ verifyToken

    await prisma.feedback.create({
      data: { content, userId, status: "PENDING" }
    });

    res.json({ success: true, message: "Đã gửi feedback, chờ sếp duyệt nhé!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gửi phản hồi" });
  }
};

// 2. Admin lấy danh sách chờ duyệt (Hiện ở trang Admin)
export const getPendingFeedbacks = async (req: Request, res: Response) => {
  const feedbacks = await prisma.feedback.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { fullName: true, avatarUrl: true } } }, // Lấy info người gửi
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, feedbacks });
};

// 3. Admin Duyệt hoặc Từ chối
export const reviewFeedback = async (req: Request, res: Response) => {
  const { id, status } = req.body; // status: "APPROVED" hoặc "REJECTED"
  await prisma.feedback.update({
    where: { id },
    data: { status }
  });
  res.json({ success: true, message: "Cập nhật trạng thái thành công" });
};

// 4. Lấy Feedback để hiện ở Slide Home (Chỉ lấy cái APPROVED)
export const getHomeFeedbacks = async (req: Request, res: Response) => {
  const feedbacks = await prisma.feedback.findMany({
    where: { status: "APPROVED" },
    include: { user: { select: { fullName: true, avatarUrl: true } } },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, feedbacks });
};

export const getAllFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      // Lấy cả APPROVED, PENDING và REJECTED để sếp quản lý tổng thể
      include: {
        user: {
          select: { fullName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách tổng hợp" });
  }
};