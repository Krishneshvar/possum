/**
 * Inventory Controller
 * Handles HTTP requests for inventory operations
 */
import * as inventoryService from './inventory.service.js';

/**
 * GET /api/inventory/variants/:id/stock
 * Get computed stock for a variant
 */
export async function getVariantStockController(req, res) {
    try {
        const variantId = parseInt(req.params.id, 10);
        if (isNaN(variantId)) {
            return res.status(400).json({ error: 'Invalid variant ID.' });
        }

        const stockInfo = inventoryService.getVariantStock(variantId);
        res.json(stockInfo);
    } catch (err) {
        console.error('Error fetching variant stock:', err);
        res.status(500).json({ error: 'Failed to retrieve stock.' });
    }
}

/**
 * GET /api/inventory/variants/:id/lots
 * Get inventory lots for a variant
 */
export async function getVariantLotsController(req, res) {
    try {
        const variantId = parseInt(req.params.id, 10);
        if (isNaN(variantId)) {
            return res.status(400).json({ error: 'Invalid variant ID.' });
        }

        const lots = inventoryService.getVariantLots(variantId);
        res.json(lots);
    } catch (err) {
        console.error('Error fetching variant lots:', err);
        res.status(500).json({ error: 'Failed to retrieve lots.' });
    }
}

/**
 * GET /api/inventory/variants/:id/adjustments
 * Get inventory adjustments for a variant
 */
export async function getVariantAdjustmentsController(req, res) {
    try {
        const variantId = parseInt(req.params.id, 10);
        if (isNaN(variantId)) {
            return res.status(400).json({ error: 'Invalid variant ID.' });
        }

        const { limit = 50, offset = 0 } = req.query;
        const adjustments = inventoryService.getVariantAdjustments(variantId, {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        });
        res.json(adjustments);
    } catch (err) {
        console.error('Error fetching adjustments:', err);
        res.status(500).json({ error: 'Failed to retrieve adjustments.' });
    }
}

/**
 * POST /api/inventory/adjustments
 * Create a manual inventory adjustment
 */
export async function createAdjustmentController(req, res) {
    try {
        const {
            variantId,
            lotId,
            quantityChange,
            reason
        } = req.body;



        if (!variantId || quantityChange === undefined || !reason) {
            return res.status(400).json({
                error: 'variantId, quantityChange, and reason are required.'
            });
        }

        // TODO: Get userId from auth context
        const userId = req.body.userId || 1;

        const result = inventoryService.adjustInventory({
            variantId: parseInt(variantId, 10),
            lotId: lotId ? parseInt(lotId, 10) : null,
            quantityChange: parseInt(quantityChange, 10),
            reason,
            referenceType: 'manual',
            referenceId: null,
            userId
        });

        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating adjustment:', err);
        if (err.code === 'INSUFFICIENT_STOCK') {
            return res.status(400).json({ error: err.message, code: err.code });
        }
        res.status(500).json({ error: 'Failed to create adjustment.' });
    }
}

/**
 * GET /api/inventory/alerts/low-stock
 * Get all variants with low stock
 */
export async function getLowStockAlertsController(req, res) {
    try {
        const alerts = inventoryService.getLowStockAlerts();
        res.json(alerts);
    } catch (err) {
        console.error('Error fetching low stock alerts:', err);
        res.status(500).json({ error: 'Failed to retrieve alerts.' });
    }
}

/**
 * GET /api/inventory/alerts/expiring
 * Get lots expiring within specified days
 */
export async function getExpiringLotsController(req, res) {
    try {
        const days = parseInt(req.query.days, 10) || 30;
        const lots = inventoryService.getExpiringLots(days);
        res.json(lots);
    } catch (err) {
        console.error('Error fetching expiring lots:', err);
        res.status(500).json({ error: 'Failed to retrieve expiring lots.' });
    }
}

/**
 * POST /api/inventory/receive
 * Receive inventory (creates lot + adjustment + product flow)
 */
export async function receiveInventoryController(req, res) {
    try {
        const {
            variantId,
            quantity,
            unitCost,
            batchNumber,
            manufacturedDate,
            expiryDate,
            purchaseOrderItemId
        } = req.body;

        if (!variantId || !quantity || unitCost === undefined) {
            return res.status(400).json({
                error: 'variantId, quantity, and unitCost are required.'
            });
        }

        // TODO: Get userId from auth context
        const userId = req.body.userId || 1;

        const result = inventoryService.receiveInventory({
            variantId: parseInt(variantId, 10),
            quantity: parseInt(quantity, 10),
            unitCost: parseFloat(unitCost),
            batchNumber: batchNumber || null,
            manufacturedDate: manufacturedDate || null,
            expiryDate: expiryDate || null,
            purchaseOrderItemId: purchaseOrderItemId ? parseInt(purchaseOrderItemId, 10) : null,
            userId
        });

        res.status(201).json(result);
    } catch (err) {
        console.error('Error receiving inventory:', err);
        res.status(500).json({ error: 'Failed to receive inventory.' });
    }
}

/**
 * GET /api/inventory/stats
 * Get aggregate inventory statistics
 */
export async function getInventoryStatsController(req, res) {
    try {
        const stats = inventoryService.getInventoryStats();
        res.json(stats);
    } catch (err) {
        console.error('Error fetching inventory stats:', err);
        res.status(500).json({ error: 'Failed to retrieve inventory stats.' });
    }
}
