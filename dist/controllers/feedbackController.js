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
        res.json({ success: true, message: req.t('feedback.sendSuccess') });
    }
    catch (error) {
        res.status(500).json({ message: req.t('feedback.sendError') });
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
        res.status(500).json({ message: req.t('feedback.fetchHomeError') });
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
        res.status(500).json({ message: req.t('feedback.fetchPendingError') });
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
        res.status(500).json({ message: req.t('feedback.fetchAllError') });
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
        const actionText = status === 'APPROVED' ? req.t('admin.approved') : req.t('admin.rejected');
        const detail = req.t('admin.feedbackReviewed', {
            action: actionText,
            user: feedback.user?.fullName
        });
        await createLog(admin, actionLabel, detail);
        res.json({ success: true, message: req.t('feedback.reviewSuccess', { status }) });
    }
    catch (error) {
        res.status(400).json({ message: req.t('feedback.reviewError') });
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
            return res.status(404).json({ message: req.t('feedback.notFound') });
        }
        await prisma.feedback.delete({
            where: { id }
        });
        const detail = req.t('admin.feedbackDeleted', { user: feedback.user?.fullName });
        await createLog(admin, "XÓA PHẢN HỒI", detail);
        res.json({ success: true, message: req.t('feedback.deleteSuccess') });
    }
    catch (error) {
        res.status(400).json({ message: req.t('feedback.deleteError') });
    }
};
//# sourceMappingURL=feedbackController.js.map