declare class AuthService {
    /**
     * 1. HÀM TẠO TOKEN DÙNG CHUNG
     * Dùng chung cho cả Login thường và Google Auth
     */
    generateToken(user: any): string;
    /**
     * 2. ĐĂNG NHẬP/ĐĂNG KÝ QUA GOOGLE
     * Tự động hồi sinh User sau khi sếp Reset DB
     */
    grantGoogleRole(profile: any): Promise<{
        token: string;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            fullName: string;
            avatarUrl: string | null;
            email: string;
            password: string | null;
            roleTitle: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    /**
     * 3. ĐĂNG KÝ TRUYỀN THỐNG
     */
    registerUser(data: any): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        fullName: string;
        avatarUrl: string | null;
        email: string;
        password: string | null;
        roleTitle: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * 4. ĐĂNG NHẬP TRUYỀN THỐNG
     */
    loginUser(data: any): Promise<{
        token: string;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            fullName: string;
            avatarUrl: string | null;
            email: string;
            password: string | null;
            roleTitle: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    /**
     * 5. LẤY THÔNG TIN BẢN THÂN
     * Trả về đủ các trường để Navbar hiện avatar và role
     */
    getMe(userId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        fullName: string;
        avatarUrl: string | null;
        email: string;
        roleTitle: string | null;
        createdAt: Date;
    }>;
    /**
     * 6. QUẢN TRỊ USER (CHO ADMIN)
     */
    getAllUsers(): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        fullName: string;
        avatarUrl: string | null;
        email: string;
        roleTitle: string | null;
        createdAt: Date;
    }[]>;
    /**
     * 7. CẬP NHẬT THÔNG TIN
     * Chống lỗi lệch kiểu Enum Role
     */
    updateUser(userId: string, updateData: any): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        fullName: string;
        avatarUrl: string | null;
        email: string;
        password: string | null;
        roleTitle: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * 8. XÓA USER
     */
    deleteUser(userId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        fullName: string;
        avatarUrl: string | null;
        email: string;
        password: string | null;
        roleTitle: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=authService.d.ts.map