import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_cua_yt_capital';

class AuthService {
  /**
   * 1. HÀM TẠO TOKEN DÙNG CHUNG
   * Dùng chung cho cả Login thường và Google Auth
   */
  generateToken(user: any) {
    return jwt.sign(
      {
        id: user.id, // Phải dùng id để khớp với Middleware mới
        role: user.role,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * 2. ĐĂNG NHẬP/ĐĂNG KÝ QUA GOOGLE
   * Tự động hồi sinh User sau khi sếp Reset DB
   */
  // src/services/authService.ts

  async grantGoogleRole(profile: any) {
    // Bóc tách kỹ để không trượt phát nào, kể cả khi Google trả về cấu trúc khác nhau
    const email = profile.email;
    const fullName = profile.name || profile.given_name || 'Người dùng Google';
    const avatarUrl = profile.picture || profile.image || null;

    if (!email) throw new Error("auth.googleAuthError");

    // 1. Tìm xem sếp đã có trong cái DB mới reset chưa
    let user = await prisma.user.findUnique({
      where: { email }
    });

    // 2. NẾU CHƯA CÓ -> TỰ ĐỘNG LƯU TÊN VÀ AVATAR VÀO LUÔN
    if (!user) {
      console.log(`>>> Tự động tạo tài khoản cho: ${email}`);
      user = await prisma.user.create({
        data: {
          email: email,
          fullName: fullName,
          avatarUrl: avatarUrl,
          role: Role.USER,
          roleTitle: 'Thành viên mới',
          password: null
        } as any
      });
    }

    // 3. Tạo Token với đầy đủ thông tin để Navbar hiện Avatar ngay
    const token = this.generateToken(user);

    return { token, user };
  }

  /**
   * 3. ĐĂNG KÝ TRUYỀN THỐNG
   */
  async registerUser(data: any) {
    const { email, password, fullName, avatarUrl } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('auth.emailExists');

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    return await prisma.user.create({
      data: {
        email,
        fullName,
        avatarUrl: avatarUrl || null,
        password: hashedPassword,
        role: Role.USER,
        roleTitle: 'Thành viên mới'
      } as any
    });
  }

  /**
   * 4. ĐĂNG NHẬP TRUYỀN THỐNG
   */
  async loginUser(data: any) {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Kiểm tra User và Password có tồn tại không
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new Error('auth.invalidCredentials');
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  /**
   * 5. LẤY THÔNG TIN BẢN THÂN
   * Trả về đủ các trường để Navbar hiện avatar và role
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        roleTitle: true,
        avatarUrl: true,
        createdAt: true
      }
    });
    if (!user) throw new Error('auth.userNotFound');
    return user;
  }

  /**
   * 6. QUẢN TRỊ USER (CHO ADMIN)
   */
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        roleTitle: true,
        avatarUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * 7. CẬP NHẬT THÔNG TIN
   * Chống lỗi lệch kiểu Enum Role
   */
  async updateUser(userId: string, updateData: any) {
    // Nếu có đổi Role, ép kiểu Enum Prisma
    if (updateData.role) {
      updateData.role = updateData.role as Role;
    }

    return await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * 8. XÓA USER
   */
  async deleteUser(userId: string) {
    return await prisma.user.delete({
      where: { id: userId }
    });
  }
}

export default new AuthService();