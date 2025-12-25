import type { Request, Response } from 'express';
import AuthService from '../services/authService.js';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await AuthService.registerUser(req.body);
    res.status(201).json({ message: 'Đăng ký thành công', userId: user.id });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { token, user } = await AuthService.loginUser(req.body);

    res.cookie('yt_capital_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({ success: true, message: 'Đăng nhập thành công sếp ơi!', token, user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await AuthService.getMe(req.user.userId);
    res.json({ user });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('yt_capital_token', { path: '/', httpOnly: true, sameSite: 'lax' });
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).json({ success: true, message: 'Đã đăng xuất thành công!' });
};

// EXPORT LẠI HÀM NÀY ĐỂ ROUTE HẾT BÁO LỖI
export const grantGoogleRole = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const { token, user } = await AuthService.grantGoogleRole(email);

    res.cookie('yt_capital_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({ success: true, user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};