import { PrismaClient } from '@prisma/client';
import { createLog } from '../services/logService.js';
const prisma = new PrismaClient();
// 1. Gửi feedback
export const sendFeedback = async (req, res) => {
    try {
        const { content, rating } = req.body;
        const userId = req.user.id;
        await prisma.feedback.create({
            data: {
                content,
                userId,
                rating: Number(rating) || 5,
                status: "PENDING"
            }
        });
        res.json({ success: true, message: "Đã gửi feedback thành công!" });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi gửi phản hồi" });
    }
};
// 2. Lấy feedback cho Slide Home (Status APPROVED)
export const getHomeFeedbacks = async (req, res) => {
    try {
        const feedbacks = await prisma.feedback.findMany({
            where: { status: "APPROVED" },
            include: { user: { select: { fullName: true, avatarUrl: true } } },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, feedbacks });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy dữ liệu trang chủ" });
    }
};
// 3. Lấy feedback chờ duyệt cho Admin
export const getPendingFeedbacks = async (req, res) => {
    try {
        const feedbacks = await prisma.feedback.findMany({
            where: { status: "PENDING" },
            include: { user: { select: { fullName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, feedbacks });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách chờ duyệt" });
    }
};
// 4. Lấy tất cả feedback (Tổng hợp)
export const getAllFeedbacks = async (req, res) => {
    try {
        const feedbacks = await prisma.feedback.findMany({
            include: { user: { select: { fullName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, feedbacks });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách tổng hợp" });
    }
};
// 5. Duyệt hoặc Từ chối feedback
export const reviewFeedback = async (req, res) => {
    const { id, status } = req.body;
    const admin = req.user;
    try {
        const feedback = await prisma.feedback.update({
            where: { id },
            data: { status },
            include: { user: { select: { fullName: true } } }
        });
        const actionLabel = status === 'APPROVED' ? "DUYỆT PHẢN HỒI" : "TỪ CHỐI PHẢN HỒI";
        const detail = `${status === 'APPROVED' ? 'Chấp nhận' : 'Loại bỏ'} của: ${feedback.user?.fullName}`;
        await createLog(admin, actionLabel, detail);
        res.json({ success: true, message: `Thao tác ${status} thành công!` });
    }
    catch (error) {
        res.status(400).json({ message: "Lỗi xử lý phản hồi" });
    }
};
// 6. Xóa feedback
export const deleteFeedback = async (req, res) => {
    const { id } = req.params;
    const admin = req.user;
    try {
        const feedback = await prisma.feedback.findUnique({
            where: { id },
            include: { user: { select: { fullName: true } } }
        });
        if (!feedback) {
            return res.status(404).json({ message: "Không tìm thấy phản hồi" });
        }
        await prisma.feedback.delete({
            where: { id }
        });
        await createLog(admin, "XÓA PHẢN HỒI", `Xóa phản hồi của: ${feedback.user?.fullName}`);
        res.json({ success: true, message: "Đã xóa phản hồi thành công!" });
    }
    catch (error) {
        res.status(400).json({ message: "Lỗi xóa phản hồi" });
    }
};
//# sourceMappingURL=feedbackController.js.map