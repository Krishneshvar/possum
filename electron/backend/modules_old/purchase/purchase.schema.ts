import { z } from 'zod';

const purchaseOrderItemSchema = z.object({
    variant_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
    unit_cost: z.number().min(0),
});

export const getPurchaseOrdersSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        searchTerm: z.string().max(120).optional(),
        status: z.enum(['pending', 'received', 'cancelled', 'all']).optional(),
        sortBy: z.enum(['id', 'supplier_name', 'order_date', 'status', 'item_count', 'total_cost']).optional(),
        sortOrder: z.enum(['ASC', 'DESC']).optional(),
    }),
});

export const getPurchaseOrderSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
});

export const createPurchaseOrderSchema = z.object({
    body: z.object({
        supplier_id: z.number().int().positive(),
        items: z.array(purchaseOrderItemSchema).min(1),
    }),
});
