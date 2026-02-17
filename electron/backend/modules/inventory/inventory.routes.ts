/**
 * Inventory Routes
 * Defines API routes for inventory operations
 */
import { Router } from 'express';
import {
    getVariantStockController,
    getVariantLotsController,
    getVariantAdjustmentsController,
    createAdjustmentController,
    getLowStockAlertsController,
    getExpiringLotsController,
    receiveInventoryController,
    getInventoryStatsController
} from './inventory.controller.js';

import { validate } from '../../shared/middleware/validate.middleware.js';
import { adjustInventorySchema, receiveInventorySchema, getVariantInventorySchema } from './inventory.schema.js';

const router = Router();

// Variant stock endpoints
router.get('/variants/:id/stock', validate(getVariantInventorySchema), getVariantStockController);
router.get('/variants/:id/lots', validate(getVariantInventorySchema), getVariantLotsController);
router.get('/variants/:id/adjustments', validate(getVariantInventorySchema), getVariantAdjustmentsController);

// Adjustment endpoints
router.post('/adjustments', validate(adjustInventorySchema), createAdjustmentController);

// Alert endpoints
router.get('/alerts/low-stock', getLowStockAlertsController);
router.get('/alerts/expiring', getExpiringLotsController);

// Receive inventory endpoint
router.post('/receive', validate(receiveInventorySchema), receiveInventoryController);

// Stats endpoint
router.get('/stats', getInventoryStatsController);

export default router;
