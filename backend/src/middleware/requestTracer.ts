import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger, { asyncLocalStorage } from '../utils/logger';

export const requestTracer = (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header('x-request-id') || uuidv4();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    const store = new Map<string, string>();
    store.set('requestId', requestId);

    asyncLocalStorage.run(store, () => {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info({
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
            }, 'Request completed');
        });

        next();
    });
};
