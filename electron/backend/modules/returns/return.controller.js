/**
 * Return Controller
 * Handles HTTP requests for returns operations
 */
import * as returnService from './return.service.js';

/**
 * POST /api/returns
 * Create a new return
 */
export async function createReturnController(req, res) {
    try {
        const { saleId, items, reason } = req.body;

        if (!saleId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'saleId and at least one item are required.'
            });
        }

        // Validate items
        for (const item of items) {
            if (!item.saleItemId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    error: 'Each item must have saleItemId and positive quantity.'
                });
            }
        }

        // TODO: Get userId from auth context
        const userId = req.body.userId || 1;

        const result = returnService.createReturn({
            saleId: parseInt(saleId, 10),
            items: items.map(item => ({
                saleItemId: parseInt(item.saleItemId, 10),
                quantity: parseInt(item.quantity, 10)
            })),
            reason: reason || null,
            userId
        });

        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating return:', err);
        res.status(400).json({ error: err.message });
    }
}

/**
 * GET /api/returns/:id
 * Get return details
 */
export async function getReturnController(req, res) {
    try {
        const returnId = parseInt(req.params.id, 10);
        if (isNaN(returnId)) {
            return res.status(400).json({ error: 'Invalid return ID.' });
        }

        const returnRecord = returnService.getReturn(returnId);
        if (!returnRecord) {
            return res.status(404).json({ error: 'Return not found.' });
        }

        res.json(returnRecord);
    } catch (err) {
        console.error('Error fetching return:', err);
        res.status(500).json({ error: 'Failed to retrieve return.' });
    }
}

/**
 * GET /api/returns
 * Get returns list
 */
export async function getReturnsController(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            saleId,
            userId,
            startDate,
            endDate
        } = req.query;

        const returns = returnService.getReturns({
            saleId: saleId ? parseInt(saleId, 10) : null,
            userId: userId ? parseInt(userId, 10) : null,
            startDate: startDate || null,
            endDate: endDate || null,
            currentPage: parseInt(page, 10),
            itemsPerPage: parseInt(limit, 10)
        });

        res.json(returns);
    } catch (err) {
        console.error('Error fetching returns:', err);
        res.status(500).json({ error: 'Failed to retrieve returns.' });
    }
}

/**
 * GET /api/sales/:saleId/returns
 * Get returns for a specific sale
 */
export async function getSaleReturnsController(req, res) {
    try {
        const saleId = parseInt(req.params.saleId, 10);
        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID.' });
        }

        const returns = returnService.getSaleReturns(saleId);
        res.json(returns);
    } catch (err) {
        console.error('Error fetching sale returns:', err);
        res.status(500).json({ error: 'Failed to retrieve returns.' });
    }
}
