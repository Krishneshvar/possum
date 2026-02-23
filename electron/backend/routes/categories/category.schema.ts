import { z } from 'zod';

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Category name must be at least 2 characters'),
        parentId: z.number().int().positive().optional().nullable(),
    })
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        name: z.string().min(2).optional(),
        parentId: z.number().int().positive().optional().nullable(),
    })
});

export const getCategorySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});
