import type { Request, Response } from 'express';
import AuthService from '../services/authService.js';

/**
 * 1. ĐĂNG KÝ
 */
export const register = async (req: Request, res: Response) => {
  try {
    const user = await AuthService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      userId: user.id
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 2. ĐĂNG NHẬP THƯỜNG
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { token, user } = await AuthService.loginUser(req.body);

    // Lưu Token vào Cookie để các Request sau tự đính kèm
    res.cookie('yt_capital_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({
      success: true,
      message: 'Đăng nhập thành công sếp ơi!',
      user
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 3. LẤY THÔNG TIN NGƯỜI DÙNG HIỆN TẠI (GET ME)
 * Sửa lại req.user.id cho khớp với Middleware
 */
export const getMe = async (req: any, res: Response) => {
  try {
    // Middleware đã gán id vào req.user
    const user = await AuthService.getMe(req.user.id);
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * 4. ĐĂNG XUẤT
 */
export const logout = (req: Request, res: Response) => {
  res.clearCookie('yt_capital_token', { path: '/', httpOnly: true, sameSite: 'lax' });
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).json({ success: true, message: 'Đã đăng xuất thành công!' });
};

/**
 * 5. ĐĂNG NHẬP GOOGLE
 * Sửa lại để nhận toàn bộ profile (email, name, picture)
 */
export const grantGoogleRole = async (req: Request, res: Response) => {
  try {
    // Nhận cả object profile từ FE gửi lên
    const profile = req.body;
    const { token, user } = await AuthService.grantGoogleRole(profile);

    res.cookie('yt_capital_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({ success: true, user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }


};