import { Request, Response, NextFunction } from 'express';

/**
 * Higher-order function to wrap async express routes.
 * Ensures all errors are passed to the global error handler for centralized logging.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
