import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log the technical error detail for developers
    logger.error(`${req.method} ${req.originalUrl} - status: ${statusCode} - error: ${err.message}`, {
        stack: err.stack,
        body: req.body,
        params: req.params,
        query: req.query,
    });

    // Send a safer error response to the client
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
