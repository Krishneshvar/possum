import { z } from 'zod';

export const createSaleSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            variantId: z.number().int().positive(),
            quantity: z.number().positive(),
            pricePerUnit: z.number().optional(),
            discount: z.number().optional()
        })).min(1),
        customerId: z.number().int().optional().nullable(),
        discount: z.number().min(0).optional(),
        payments: z.array(z.object({
            paymentMethodId: z.number().int().positive(),
            amount: z.number().positive()
        })).optional(),
        fulfillment_status: z.enum(['pending', 'processing', 'completed', 'cancelled']).optional(),
        taxMode: z.string().optional(),
        billTaxIds: z.array(z.number()).optional()
    })
});

export const addPaymentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        amount: z.number().positive(),
        paymentMethodId: z.number().int().positive()
    })
});

export const getSaleSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    })
});

export const updateSaleSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number)
    }),
    body: z.object({
        status: z.enum(['cancelled']).optional() // Currently only cancelled is supported in controller
    })
});
