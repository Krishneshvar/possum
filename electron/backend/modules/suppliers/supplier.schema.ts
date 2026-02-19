import { z } from 'zod';

export const createSupplierSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Supplier name is required'),
        contact_person: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().email('Invalid email format').optional().nullable(),
        address: z.string().optional().nullable(),
        gstin: z.string().optional().nullable(),
    })
});

export const updateSupplierSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        contact_person: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        address: z.string().optional().nullable(),
        gstin: z.string().optional().nullable(),
    })
});

export const getSupplierSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});
