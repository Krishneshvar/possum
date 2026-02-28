import { z } from 'zod';

const optionalNullableString = z.string().trim().optional().nullable();

export const getSuppliersSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(1000).optional(),
        searchTerm: z.string().trim().max(200).optional(),
        sortBy: z.enum(['name', 'contact_person', 'phone', 'email', 'created_at']).optional(),
        sortOrder: z.enum(['ASC', 'DESC']).optional(),
    })
});

export const createSupplierSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, 'Supplier name is required').max(150),
        contact_person: optionalNullableString,
        phone: optionalNullableString,
        email: z.string().email('Invalid email format').optional().nullable(),
        address: optionalNullableString,
        gstin: optionalNullableString,
        payment_policy_id: z.number().int().positive().optional(),
    })
});

export const updateSupplierSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        name: z.string().trim().min(1).max(150).optional(),
        contact_person: optionalNullableString,
        phone: optionalNullableString,
        email: z.string().email().optional().nullable(),
        address: optionalNullableString,
        gstin: optionalNullableString,
        payment_policy_id: z.number().int().positive().optional(),
    })
});

export const getSupplierSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});

export const createPaymentPolicySchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, 'Payment policy name is required').max(100),
        days_to_pay: z.number().int().min(0, 'Days to pay must be 0 or greater'),
        description: optionalNullableString,
    })
});
