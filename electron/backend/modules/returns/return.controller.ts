/**
 * Return Controller
 * Handles HTTP requests for returns
 */
import * as returnService from './return.service.js';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString } from '../../shared/utils/index.js';

/**
 * POST /api/returns
 * Create a new return
 */
export async function createReturnController(req: Request, res: Response) {
    try {
        const { saleId, items, reason } = req.body;

        if (!saleId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Sale ID and at least one item are required.' });
        }

        // Use userId from auth context
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
        }

        const result = returnService.createReturn(
            parseInt(saleId, 10),
            items,
            reason,
            userId
        );

        res.status(201).json(result);
    } catch (err: any) {
        console.error('Error creating return:', err);
        res.status(500).json({ error: err.message || 'Failed to create return.' });
    }
}

/**
 * GET /api/returns/:id
 * Get return details
 */
export async function getReturnController(req: Request, res: Response) {
    try {
        const returnId = parseInt(req.params.id as string, 10);
        if (isNaN(returnId)) {
            return res.status(400).json({ error: 'Invalid return ID.' });
        }

        const returnDetails = returnService.getReturn(returnId);
        if (!returnDetails) {
            return res.status(404).json({ error: 'Return not found.' });
        }
        res.json(returnDetails);
    } catch (err) {
        console.error('Error fetching return:', err);
        res.status(500).json({ error: 'Failed to retrieve return.' });
    }
}

/**
 * GET /api/returns/sale/:saleId
 * Get returns for a specific sale
 */
export async function getSaleReturnsController(req: Request, res: Response) {
    try {
        const saleId = parseInt(req.params.saleId as string, 10);
        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID.' });
        }

        const returns = returnService.getSaleReturns(saleId);
        res.json(returns);
    } catch (err) {
        console.error('Error fetching sale returns:', err);
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
            page,
            limit
        } = req.query;

        const returns = returnService.getReturns({
            saleId: getQueryNumber(saleId),
            userId: getQueryNumber(userId),
            startDate: getQueryString(startDate),
            endDate: getQueryString(endDate),
            currentPage: getQueryNumber(page, 1) || 1,
            itemsPerPage: getQueryNumber(limit, 20) || 20
        });

        res.json(returns);
    } catch (err) {
        console.error('Error fetching returns:', err);
        res.status(500).json({ error: 'Failed to retrieve returns.' });
    }
}
