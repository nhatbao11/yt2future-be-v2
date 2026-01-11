import type { Request, Response } from 'express';
export declare const sendFeedback: (req: any, res: Response) => Promise<void>;
export declare const getHomeFeedbacks: (req: Request, res: Response) => Promise<void>;
export declare const getPendingFeedbacks: (req: Request, res: Response) => Promise<void>;
export declare const getAllFeedbacks: (req: Request, res: Response) => Promise<void>;
export declare const reviewFeedback: (req: any, res: Response) => Promise<void>;
export declare const deleteFeedback: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=feedbackController.d.ts.map