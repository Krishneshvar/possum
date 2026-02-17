import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware to validate request using a Zod schema
 * @param schema Zod schema to validate against
 */
export const validate = (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed: any = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // Replace request parts with parsed data to ensure type safety and strip unknown fields
        req.body = parsed.body;
        req.query = parsed.query;
        req.params = parsed.params;

        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues.map(issue => ({
                    path: issue.path,
                    message: issue.message,
                })),
            });
        }
        next(error);
    }
};
