import { Router } from 'express';
// Nhớ thêm grantGoogleRole vào dòng import này nhé sếp
import { register, login, getMe, logout, grantGoogleRole } from '../controllers/authController.js';
import { isAdmin, verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/grant-google-role', grantGoogleRole);
router.get('/admin', verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Dữ liệu mật cho Admin" });
});
// Thêm dòng này để fix lỗi 404 cho Navbar
// router.post('/grant-google-role', grantGoogleRole);

router.get('/me', verifyToken, getMe);

export default router;