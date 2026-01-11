import type { Request, Response } from 'express';
/**
 * 1. ĐĂNG KÝ
 */
export declare const register: (req: Request, res: Response) => Promise<void>;
/**
 * 2. ĐĂNG NHẬP THƯỜNG
 */
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 3. LẤY THÔNG TIN NGƯỜI DÙNG HIỆN TẠI (GET ME)
 * Sửa lại req.user.id cho khớp với Middleware
 */
export declare const getMe: (req: any, res: Response) => Promise<void>;
/**
 * 4. ĐĂNG XUẤT
 */
export declare const logout: (req: Request, res: Response) => Response<any, Record<string, any>>;
/**
 * 5. ĐĂNG NHẬP GOOGLE
 * Sửa lại để nhận toàn bộ profile (email, name, picture)
 */
export declare const grantGoogleRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authController.d.ts.map