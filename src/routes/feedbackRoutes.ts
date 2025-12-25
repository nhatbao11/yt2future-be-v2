import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/send', verifyToken, feedbackController.sendFeedback);
router.get('/home', feedbackController.getHomeFeedbacks);
router.get('/pending', verifyToken, isAdmin, feedbackController.getPendingFeedbacks);
router.get('/all', verifyToken, isAdmin, feedbackController.getAllFeedbacks);
router.post('/review', verifyToken, isAdmin, feedbackController.reviewFeedback);

export default router;