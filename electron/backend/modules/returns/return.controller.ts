/**
 * Return Controller
 * Handles HTTP requests for returns
 */
import * as returnService from './return.service.js';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString } from '../../shared/utils/index.js';
import { logger } from '../../shared/utils/logger.js';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
    };
}

/**
 * POST /api/returns
 * Create a new return
 */
export async function createReturnController(req: AuthenticatedRequest, res: Response) {
    try {
        const { saleId, items, reason } = req.body;

        // Use userId from auth context
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
        }

        const result = returnService.createReturn(
            saleId,
            items,
            reason,
            userId
        );

        res.status(201).json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create return.';
        const lowerMessage = String(message).toLowerCase();
        const statusCode = lowerMessage.includes('not found')
            ? 404
            : lowerMessage.includes('cannot return')
                || lowerMessage.includes('invalid')
                || lowerMessage.includes('required')
                || lowerMessage.includes('at least one')
                || lowerMessage.includes('maximum refundable')
                ? 400
                : 500;
        logger.error(`Error creating return for user ${req.user?.id ?? 'unknown'}: ${message}`);
        res.status(statusCode).json({ error: message });
    }
}

/**
 * GET /api/returns/:id
 * Get return details
 */
export async function getReturnController(req: Request, res: Response) {
    try {
        const returnId = Number(req.params.id);
        if (isNaN(returnId)) {
            return res.status(400).json({ error: 'Invalid return ID.' });
        }

        const returnDetails = returnService.getReturn(returnId);
        if (!returnDetails) {
            return res.status(404).json({ error: 'Return not found.' });
        }
        res.json(returnDetails);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Error fetching return ${req.params.id}: ${message}`);
        res.status(500).json({ error: 'Failed to retrieve return.' });
    }
}

/**
 * GET /api/returns/sale/:saleId
 * Get returns for a specific sale
 */
export async function getSaleReturnsController(req: Request, res: Response) {
    try {
        const saleId = Number(req.params.saleId);
        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID.' });
        }

        const returns = returnService.getSaleReturns(saleId);
        res.json(returns);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Error fetching sale returns for sale ${req.params.saleId}: ${message}`);
        res.status(500).json({ error: 'Failed to retrieve sale returns.' });
    }
}

/**
 * GET /api/returns
 * Get returns list with pagination
 */
export async function getReturnsController(req: Request, res: Response) {
    try {
        const {
            saleId,
            userId,
            startDate,
            endDate,
            searchTerm,
            page,
            limit
        } = req.query;

        const returns = returnService.getReturns({
            saleId: getQueryNumber(saleId),
            userId: getQueryNumber(userId),
            startDate: getQueryString(startDate),
            endDate: getQueryString(endDate),
            searchTerm: getQueryString(searchTerm),
            currentPage: getQueryNumber(page, 1) || 1,
            itemsPerPage: getQueryNumber(limit, 20) || 20
        });

        res.json(returns);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Error fetching returns list: ${message}`);
        res.status(500).json({ error: 'Failed to retrieve returns.' });
    }
}
