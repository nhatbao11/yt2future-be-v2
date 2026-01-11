import type { Request, Response } from 'express';
export declare const adminLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const listUsers: (req: Request, res: Response) => Promise<void>;
export declare const updateRole: (req: any, res: Response) => Promise<void>;
export declare const removeUser: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAuditLogs: (req: Request, res: Response) => Promise<void>;
export declare const getDashboardStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map