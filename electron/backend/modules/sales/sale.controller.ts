/**
 * Sale Controller
 * Handles HTTP requests for sales operations
 */
import * as SaleService from './sale.service.js';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString, getQueryArray } from '../../shared/utils/index.js';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
    };
    token?: string;
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
        const token = (req as any).token; // From middleware

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
        // Check for specific errors
        if (error.message && error.message.includes('Insufficient stock')) {
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

        // Convert page and limit to numbers and map to what repository expects
        const params = {
            status: getQueryArray(status),
            customerId: getQueryNumber(customerId),
            startDate: getQueryString(startDate),
            endDate: getQueryString(endDate),
            searchTerm: getQueryString(searchTerm),
            currentPage: getQueryNumber(page, 1) || 1,
            itemsPerPage: getQueryNumber(limit, 10) || 10,
            sortBy: getQueryString(sortBy),
            sortOrder: getQueryString(sortOrder) as 'ASC' | 'DESC' | undefined,
            fulfillmentStatus: getQueryArray(fulfillmentStatus)
        };

        const result = await SaleService.getSales(params);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/sales/:id
 */
export async function getSale(req: Request, res: Response) {
    try {
        const result = await SaleService.getSale(parseInt(req.params.id as string, 10));
        if (!result) return res.status(404).json({ error: 'Sale not found' });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * PUT /api/sales/:id
 */
export async function updateSale(req: AuthenticatedRequest, res: Response) {
    try {
        const { status } = req.body;
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userId = req.user.id;
        const token = (req as any).token;
        const saleId = parseInt(req.params.id as string, 10);

        if (status === 'cancelled') {
            const result = await SaleService.cancelSale(saleId, userId, token);
            return res.json(result);
        }

        res.status(400).json({ error: 'Update not supported except cancellation' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function deleteSale(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userId = req.user.id;
        const token = (req as any).token;
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
        const token = (req as any).token;
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
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userId = req.user.id;
        const token = (req as any).token;

        const result = await SaleService.addPayment({
            saleId,
            amount,
            paymentMethodId,
            userId,
            token
        });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}
