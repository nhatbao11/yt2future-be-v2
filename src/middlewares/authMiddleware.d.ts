import type { Response, NextFunction } from 'express';
/**
 * 1. XÁC THỰC TOKEN
 * Sửa lại để gán 'id' thay vì 'userId' cho khớp với Prisma và Controller
 */
export declare const verifyToken: (req: any, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * 2. KIỂM TRA QUYỀN ADMIN
 */
export declare const isAdmin: (req: any, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * 3. KIỂM TRA QUYỀN CỘNG TÁC VIÊN HOẶC ADMIN
 * Dùng cho các chức năng đăng bài, upload file
 */
export declare const isCTVOrAdmin: (req: any, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * 4. KIỂM TRA CHỈ RIÊNG QUYỀN CTV
 */
export declare const isCTV: (req: any, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map