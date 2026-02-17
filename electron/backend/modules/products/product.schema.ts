import { z } from 'zod';

const jsonOrArray = (schema: z.ZodTypeAny) => z.preprocess((val: any) => {
    if (typeof val === 'string') {
        try {
            return JSON.parse(val);
        } catch {
            return val;
        }
    }
    return val;
}, schema);

const jsonOrNumber = z.preprocess((val: any) => {
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
    }
    return val;
}, z.number());

export const createProductSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Product name is required'),
        category_id: z.union([z.string(), z.number()]).transform((val: any) => parseInt(String(val), 10)).optional().nullable(),
        description: z.string().optional().nullable(),
        status: z.enum(['active', 'inactive']).optional().default('active'),
        variants: jsonOrArray(z.array(z.object({
            name: z.string().min(1, 'Variant name is required'),
            sku: z.string().optional().nullable(),
            price: z.union([z.string(), z.number()]).transform((val: any) => parseFloat(String(val)) || 0).optional(),
            cost_price: z.union([z.string(), z.number()]).transform((val: any) => parseFloat(String(val)) || 0).optional(),
            stock: z.union([z.string(), z.number()]).transform((val: any) => parseInt(String(val), 10) || 0).optional()
        }))).refine((val: any) => val.length > 0, 'At least one variant is required'),
        taxIds: jsonOrArray(z.array(z.number())).optional().default([])
    })
});

export const updateProductSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        category_id: z.union([z.string(), z.number()]).transform((val: any) => parseInt(String(val), 10)).optional(),
        description: z.string().optional().nullable(),
        status: z.enum(['active', 'inactive']).optional(),
        variants: jsonOrArray(z.array(z.object({
            id: z.number().optional(), // Existing variants have IDs
            name: z.string().min(1).optional(),
            sku: z.string().optional().nullable(),
            price: z.union([z.string(), z.number()]).transform((val: any) => parseFloat(String(val))).optional(),
            cost_price: z.union([z.string(), z.number()]).transform((val: any) => parseFloat(String(val))).optional(),
            stock: z.union([z.string(), z.number()]).transform((val: any) => parseInt(String(val), 10)).optional()
        }))).optional(),
        taxIds: jsonOrArray(z.array(z.number())).optional()
    })
});

export const getProductSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});
