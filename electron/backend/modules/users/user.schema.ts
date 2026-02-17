import { z } from 'zod';

export const createUserSchema = z.object({
    body: z.object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        name: z.string().min(1, 'Name is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role_id: z.number().int().positive().optional(),
        is_active: z.union([z.boolean(), z.number()]).transform(val => (val === true || val === 1) ? 1 : 0).optional()
    })
});

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        username: z.string().min(3).optional(),
        name: z.string().min(1).optional(),
        password: z.string().min(6).optional(),
        role_id: z.number().int().positive().optional(),
        is_active: z.union([z.boolean(), z.number()]).transform(val => (val === true || val === 1) ? 1 : 0).optional()
    })
});

export const getUserIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});
