import { z } from 'zod';

const returnItemSchema = z.object({
    saleItemId: z.number().int().positive(),
    quantity: z.number().int().positive()
});

export const createReturnSchema = z.object({
    body: z.object({
        saleId: z.number().int().positive(),
        items: z.array(returnItemSchema).min(1),
        reason: z.string().trim().min(1).max(500)
    })
});

export const getReturnSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});

export const getSaleReturnsSchema = z.object({
    params: z.object({
        saleId: z.string().regex(/^\d+$/).transform(Number)
    })
});

export const getReturnsQuerySchema = z.object({
    query: z.object({
        saleId: z.string().regex(/^\d+$/).transform(Number).optional(),
        userId: z.string().regex(/^\d+$/).transform(Number).optional(),
        startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        searchTerm: z.string().trim().max(100).optional(),
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional()
    })
});
