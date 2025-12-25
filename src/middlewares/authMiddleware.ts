import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_cua_yt_capital';

export const verifyToken = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies['yt_capital_token'];

  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy phiên đăng nhập. Mời sếp đăng nhập lại!' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Lưu đầy đủ thông tin để logService có dữ liệu sử dụng
    req.user = {
      userId: decoded.id,
      fullName: decoded.fullName,
      avatarUrl: decoded.avatarUrl, // Sẽ dùng để hiện ảnh ở Dashboard
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ!' });
  }
};

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ message: 'Cảnh báo: Sếp không có quyền truy cập khu vực này!' });
  }
};