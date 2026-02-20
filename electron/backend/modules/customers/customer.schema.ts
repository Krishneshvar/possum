import { z } from 'zod';

const sortBySchema = z.enum(['name', 'email', 'created_at']);
const sortOrderSchema = z.enum(['ASC', 'DESC']);

const queryNumber = (fallback: number, min: number, max: number) =>
    z.coerce.number().int().min(min).max(max).optional().default(fallback);

export const createCustomerSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, 'Name is required'),
        phone: z.string().optional().nullable(),
        email: z.string().email('Invalid email format').optional().nullable(),
        address: z.string().optional().nullable(),
    })
});

export const updateCustomerSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        name: z.string().trim().min(1).optional(),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        address: z.string().optional().nullable(),
    })
});

export const getCustomerSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});

export const getCustomersQuerySchema = z.object({
    query: z.object({
        searchTerm: z.string().trim().optional(),
        page: queryNumber(1, 1, 10_000),
        limit: queryNumber(10, 1, 1_000),
        currentPage: queryNumber(1, 1, 10_000),
        itemsPerPage: queryNumber(10, 1, 1_000),
        sortBy: sortBySchema.optional().default('name'),
        sortOrder: z
            .string()
            .optional()
            .transform((value) => (value ? value.toUpperCase() : undefined))
            .pipe(sortOrderSchema.optional().default('ASC')),
    }),
});
