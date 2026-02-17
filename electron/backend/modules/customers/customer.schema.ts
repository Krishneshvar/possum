import { z } from 'zod';

export const createCustomerSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        phone: z.string().optional().nullable(),
        email: z.string().email('Invalid email format').optional().nullable(),
        address: z.string().optional().nullable(),
        gstin: z.string().optional().nullable(),
    })
});

export const updateCustomerSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        address: z.string().optional().nullable(),
        gstin: z.string().optional().nullable(),
    })
});

export const getCustomerSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});
