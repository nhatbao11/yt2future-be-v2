import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/send', verifyToken, feedbackController.sendFeedback);
router.get('/home', feedbackController.getHomeFeedbacks);
router.get('/pending', verifyToken, isAdmin, feedbackController.getPendingFeedbacks);
router.get('/all', verifyToken, isAdmin, feedbackController.getAllFeedbacks);
router.post('/review', verifyToken, isAdmin, feedbackController.reviewFeedback);
router.delete('/:id', verifyToken, isAdmin, feedbackController.deleteFeedback);
// Đường dẫn thực tế sẽ là: /api/admin/feedback/pending
// router.get('/pending', verifyToken, isAdmin, feedbackController.getPendingFeedbacks);

// // Đường dẫn thực tế sẽ là: /api/admin/feedback/all
// router.get('/all', verifyToken, isAdmin, feedbackController.getAllFeedbacks);

export default router;