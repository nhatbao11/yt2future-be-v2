import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_cua_yt_capital';

export const verifyToken = (req: any, res: Response, next: NextFunction) => {
  // 1. Lấy token trực tiếp từ Cookie
  const token = req.cookies['yt_capital_token'];

  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy phiên đăng nhập. Mời sếp đăng nhập lại!' });
  }

  try {
    // 2. Kiểm tra token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. Lưu thông tin user vào request để các controller sau sử dụng
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ!' });
  }


};


export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  // Sau khi verifyToken chạy xong, req.user đã có role từ DB
  if (req.user && req.user.role === 'ADMIN') {
    next(); // Đúng sếp ADMIN thì cho vào
  } else {
    // Nếu là MEMBER mà đòi vào Admin thì đuổi thẳng cánh
    return res.status(403).json({
      message: 'Cảnh báo: Sếp không có quyền truy cập khu vực này!'
    });
  }
};
