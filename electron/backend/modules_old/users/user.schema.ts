import { z } from 'zod';

const sortFieldSchema = z.enum(['name', 'username', 'created_at']);
const sortOrderSchema = z.enum(['ASC', 'DESC']);

export const createUserSchema = z.object({
    body: z.object({
        username: z.string().trim().min(3, 'Username must be at least 3 characters'),
        name: z.string().trim().min(1, 'Name is required'),
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
        username: z.string().trim().min(3).optional(),
        name: z.string().trim().min(1).optional(),
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

export const getUsersSchema = z.object({
    query: z.object({
        // Canonical API parameters
        searchTerm: z.string().trim().optional(),
        currentPage: z.coerce.number().int().min(1).optional(),
        itemsPerPage: z.coerce.number().int().min(1).max(100).optional(),
        sortBy: sortFieldSchema.optional(),
        sortOrder: sortOrderSchema.optional(),

        // Backward compatibility with current frontend parameter names
        search: z.string().trim().optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }).transform((query) => ({
        searchTerm: query.searchTerm ?? query.search,
        currentPage: query.currentPage ?? query.page ?? 1,
        itemsPerPage: query.itemsPerPage ?? query.limit ?? 10,
        sortBy: query.sortBy ?? 'created_at',
        sortOrder: query.sortOrder ?? 'DESC',
    }))
});
