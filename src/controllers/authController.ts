import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_cua_yt_capital';

// 1. ĐĂNG KÝ: Để mặc định là MEMBER
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email đã tồn tại' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // CHỈNH SỬA: Mặc định là MEMBER để bảo mật. 
    // Sếp có thể vào DB đổi tay hoặc dùng trang Admin để nâng cấp sau này.
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        role: 'MEMBER'
      }
    });

    res.status(201).json({ message: 'Đăng ký thành công', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi đăng ký' });
  }
};

// 2. ĐĂNG NHẬP: Gói Role vào Token để Middleware check nhanh
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Thông tin tài khoản không chính xác!' });
    }

    // Gói cả Role vào Token để Middleware ở Next.js đọc được ngay không cần gọi DB
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
      token: token,
      user: { id: user.id, fullName: user.fullName, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

// 3. GET ME: Đây là trái tim của việc cập nhật Role linh hoạt
export const getMe = async (req: any, res: Response) => {
  try {
    // Luôn truy vấn DB để lấy Role mới nhất, tránh dùng Role cũ trong Token bị "outdate"
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true, // Nếu sếp đổi từ MEMBER lên ADMIN trong DB, chỗ này sẽ trả về ADMIN ngay
        avatarUrl: true
      }
    });

    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xác thực' });
  }
};

// 4. ĐĂNG XUẤT: Giữ nguyên bản nâng cấp chặn Cache của sếp
export const logout = (req: Request, res: Response) => {
  res.clearCookie('yt_capital_token', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  return res.status(200).json({
    success: true,
    message: 'Đã đăng xuất thành công!'
  });
};


// Thêm hàm này vào cuối file authController.ts
// Thêm vào authController.ts
export const grantGoogleRole = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Tìm user trong DB bằng email để lấy Role và Ảnh thật
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fullName: true, role: true, avatarUrl: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User chưa tồn tại trong Database của BE" });
    }

    // Tạo token chứa thông tin của mình
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // BẮT ĐẦU IN COOKIE THỨ 3 ĐÂY SẾP:
    res.cookie('yt_capital_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({
      success: true,
      user: {
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi in cookie BE" });
  }
};
