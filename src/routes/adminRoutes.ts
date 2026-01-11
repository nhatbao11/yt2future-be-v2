// src/routes/adminRoutes.ts
import { Router } from 'express';
import { listUsers, updateRole, removeUser, getAuditLogs } from '../controllers/adminController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// Tất cả route admin đều phải qua 2 lớp bảo vệ
router.use(verifyToken, isAdmin);


router.get('/logs', verifyToken, isAdmin, adminController.getAuditLogs);
router.get('/stats', verifyToken, isAdmin, adminController.getDashboardStats);
router.get('/users', listUsers);
router.put('/users/role', updateRole);
router.delete('/users/:id', removeUser);

export default router;