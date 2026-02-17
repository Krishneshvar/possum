import { z } from 'zod';

export const adjustInventorySchema = z.object({
    body: z.object({
        variantId: z.number().int().positive(),
        lotId: z.number().int().positive().optional().nullable(),
        quantityChange: z.number(),
        reason: z.enum(['sale', 'return', 'confirm_receive', 'spoilage', 'damage', 'theft', 'correction'])
    })
});

export const receiveInventorySchema = z.object({
    body: z.object({
        variantId: z.number().int().positive(),
        quantity: z.number().positive(),
        unitCost: z.number().min(0),
        batchNumber: z.string().optional().nullable(),
        manufacturedDate: z.string().optional().nullable(),
        expiryDate: z.string().optional().nullable(),
        purchaseOrderItemId: z.number().int().positive().optional().nullable()
    })
});

export const getVariantInventorySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});
