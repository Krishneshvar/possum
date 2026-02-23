import * as SaleService from '../../../../packages/core/src/modules/sales/index.js';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString, getQueryArray } from '../../shared/utils/index.js';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
    };
    token?: string;
    permissions?: string[];
}

/**
 * POST /api/sales
 * Create a new sale
 */
export async function createSale(req: AuthenticatedRequest, res: Response) {
    try {
        const { items, customerId, discount, payments, taxMode, billTaxIds, fulfillment_status } = req.body;

        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userId = req.user.id;
        const token = req.token;

        const result = await SaleService.createSale({
            items,
            customerId,
            userId,
            discount,
            payments,
            taxMode,
            billTaxIds,
            fulfillment_status,
            token
        });

        res.status(201).json(result);
    } catch (error: any) {
        if (error.message?.includes('Insufficient stock')) {
            return res.status(400).json({ error: error.message, code: 'INSUFFICIENT_STOCK' });
        }
        res.status(400).json({ error: error.message });
    }
}

/**
 * GET /api/sales
 */
export async function getSales(req: Request, res: Response) {
    try {
        const {
            page,
            limit,
            status,
            customerId,
            startDate,
            endDate,
            searchTerm,
            fulfillmentStatus,
            sortBy,
            sortOrder
        } = req.query;

        if (startDate && typeof startDate === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(startDate)) {
            return res.status(400).json({ error: 'Invalid startDate format. Expected YYYY-MM-DD', code: 'INVALID_DATE' });
        }
        if (endDate && typeof endDate === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(endDate)) {
            return res.status(400).json({ error: 'Invalid endDate format. Expected YYYY-MM-DD', code: 'INVALID_DATE' });
        }

        const params = {
            status: getQueryArray(status),
            customerId: getQueryNumber(customerId),
            startDate: getQueryString(startDate),
            endDate: getQueryString(endDate),
            searchTerm: getQueryString(searchTerm),
            currentPage: getQueryNumber(page, 1) || 1,
            itemsPerPage: getQueryNumber(limit, 10) || 10,
            sortBy: getQueryString(sortBy),
            sortOrder: (getQueryString(sortOrder)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC',
            fulfillmentStatus: getQueryArray(fulfillmentStatus)
        };

        const result = await SaleService.getSales(params);
        res.json({
            sales: result.sales,
            totalRecords: result.totalCount,
            totalPages: result.totalPages,
            currentPage: result.currentPage
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
    }
}

/**
 * GET /api/sales/:id
 */
export async function getSale(req: AuthenticatedRequest, res: Response) {
    try {
        const saleId = parseInt(req.params.id as string, 10);
        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID', code: 'INVALID_ID' });
        }
        
        const userId = req.user?.id;
        const result = await SaleService.getSale(saleId, userId);
        if (!result) return res.status(404).json({ error: 'Sale not found', code: 'NOT_FOUND' });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
    }
}

/**
 * PUT /api/sales/:id
 */
export async function updateSale(req: AuthenticatedRequest, res: Response) {
    try {
        const { status } = req.body;
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session', code: 'UNAUTHORIZED' });
        const userId = req.user.id;
        const token = req.token;
        const saleId = parseInt(req.params.id as string, 10);

        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID', code: 'INVALID_ID' });
        }

        if (status === 'cancelled') {
            const result = await SaleService.cancelSale(saleId, userId, token);
            return res.json(result);
        }

        res.status(400).json({ error: 'Update not supported except cancellation', code: 'INVALID_OPERATION' });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: error.message, code: error.code || 'UPDATE_FAILED' });
    }
}

export async function deleteSale(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userId = req.user.id;
        const token = req.token;
        const saleId = parseInt(req.params.id as string, 10);

        const result = await SaleService.cancelSale(saleId, userId, token);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getPaymentMethods(req: Request, res: Response) {
    try {
        const methods = await SaleService.getPaymentMethods();
        res.json(methods);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function fulfillSale(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userId = req.user.id;
        const saleId = parseInt(req.params.id as string, 10);
        const token = req.token;
        const result = await SaleService.fulfillSale(saleId, userId, token);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function addPayment(req: AuthenticatedRequest, res: Response) {
    try {
        const saleId = parseInt(req.params.id as string, 10);
        const { amount, paymentMethodId } = req.body;
        
        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID', code: 'INVALID_ID' });
        }
        
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session', code: 'UNAUTHORIZED' });
        const userId = req.user.id;
        const token = req.token;

        const result = await SaleService.addPayment({
            saleId,
            amount,
            paymentMethodId,
            userId,
            token
        });
        res.json(result);
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: error.message, code: error.code || 'PAYMENT_FAILED' });
    }
}
