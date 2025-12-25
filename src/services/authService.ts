import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_cua_yt_capital';

class AuthService {
  // 1. Đăng ký
  async registerUser(data: any) {
    const { email, password, fullName } = data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email đã tồn tại');

    const hashedPassword = await bcrypt.hash(password, 10);
    return await prisma.user.create({
      data: { email, fullName, password: hashedPassword, role: 'MEMBER' }
    });
  }

  // 2. Đăng nhập (SỬA LẠI TOKEN TẠI ĐÂY)
  async loginUser(data: any) {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Thông tin tài khoản không chính xác!');
    }

    // Nạp đầy đủ thông tin vào Token để Middleware và Navbar đọc được
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user };
  }

  // 3. Lấy thông tin bản thân (Me)
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true, avatarUrl: true }
    });
    if (!user) throw new Error('Không tìm thấy người dùng');
    return user;
  }

  // 4. Cấp Role cho Google Auth (SỬA LẠI TOKEN TẠI ĐÂY)
  async grantGoogleRole(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fullName: true, role: true, avatarUrl: true }
    });

    if (!user) throw new Error("User chưa tồn tại trong Database của BE");

    // Đồng bộ Token giống như hàm Login
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user };
  }

  // Lấy toàn bộ danh sách User cho Admin
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Cập nhật thông tin User
  async updateUser(userId: string, updateData: any) {
    return await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  // Xóa User
  async deleteUser(userId: string) {
    return await prisma.user.delete({
      where: { id: userId }
    });
  }
}

export default new AuthService();