import AuthService from '../services/authService.js';
/**
 * 1. ĐĂNG KÝ
 */
export const register = async (req, res) => {
    try {
        const user = await AuthService.registerUser(req.body);
        res.status(201).json({
            success: true,
            message: req.t('auth.registerSuccess'),
            userId: user.id
        });
    }
    catch (error) {
        // Check if error message is a translation key
        const message = error.message.startsWith('auth.')
            ? req.t(error.message)
            : error.message;
        res.status(400).json({ success: false, message });
    }
};
/**
 * 2. ĐĂNG NHẬP THƯỜNG
 */
export const login = async (req, res) => {
    try {
        const { token, user } = await AuthService.loginUser(req.body);
        // Lưu Token vào Cookie để các Request sau tự đính kèm
        res.cookie('yt2future_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });
        return res.json({
            success: true,
            message: req.t('auth.loginSuccess'),
            user,
            token // Trả về Token để FE (Server Action) có thể lấy và set Cookie
        });
    }
    catch (error) {
        const message = error.message.startsWith('auth.')
            ? req.t(error.message)
            : error.message;
        res.status(400).json({ success: false, message });
    }
};
/**
 * 3. LẤY THÔNG TIN NGƯỜI DÙNG HIỆN TẠI (GET ME)
 * Sửa lại req.user.id cho khớp với Middleware
 */
export const getMe = async (req, res) => {
    try {
        // Middleware đã gán id vào req.user
        const user = await AuthService.getMe(req.user.id);
        res.json({ success: true, user });
    }
    catch (error) {
        const message = error.message.startsWith('auth.')
            ? req.t(error.message)
            : error.message;
        res.status(404).json({ success: false, message });
    }
};
/**
 * 4. ĐĂNG XUẤT
 */
export const logout = (req, res) => {
    res.clearCookie('yt2future_token', { path: '/', httpOnly: true, sameSite: 'lax' });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).json({ success: true, message: req.t('auth.logoutSuccess') });
};
/**
 * 5. ĐĂNG NHẬP GOOGLE
 * Sửa lại để nhận toàn bộ profile (email, name, picture)
 */
export const grantGoogleRole = async (req, res) => {
    try {
        // Nhận cả object profile từ FE gửi lên
        const profile = req.body;
        const { token, user } = await AuthService.grantGoogleRole(profile);
        res.cookie('yt2future_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });
        return res.json({ success: true, user });
    }
    catch (error) {
        const message = error.message.startsWith('auth.')
            ? req.t(error.message)
            : req.t('auth.googleAuthError');
        res.status(400).json({ success: false, message });
    }
};
//# sourceMappingURL=authController.js.map