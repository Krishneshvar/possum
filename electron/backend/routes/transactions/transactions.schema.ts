import { z } from 'zod';

const sortByValues = ['transaction_date', 'amount', 'status', 'customer_name', 'invoice_number', 'supplier_name'] as const;
const sortOrderValues = ['ASC', 'DESC'] as const;
const transactionTypeValues = ['payment', 'refund', 'purchase', 'purchase_refund'] as const;
const transactionStatusValues = ['completed', 'pending', 'cancelled'] as const;

export const getTransactionsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().max(100000).optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        type: z.enum(transactionTypeValues).optional(),
        paymentMethodId: z.coerce.number().int().positive().optional(),
        status: z.enum(transactionStatusValues).optional(),
        searchTerm: z.string().trim().max(100).optional(),
        sortBy: z.enum(sortByValues).optional(),
        sortOrder: z.enum(sortOrderValues).optional()
    }).refine(
        (data) => {
            if (!data.startDate || !data.endDate) return true;
            return data.startDate <= data.endDate;
        },
        { message: 'startDate must be before or equal to endDate', path: ['startDate'] }
    )
});

export type GetTransactionsQuery = z.infer<typeof getTransactionsSchema>['query'];
