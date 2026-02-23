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
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Variant stock endpoints
router.get('/variants/:id/stock', requirePermission(['inventory.manage', 'inventory.view', 'reports.view', 'sales.create']), validate(getVariantInventorySchema), getVariantStockController);
router.get('/variants/:id/lots', requirePermission(['inventory.manage', 'inventory.view', 'reports.view']), validate(getVariantInventorySchema), getVariantLotsController);
router.get('/variants/:id/adjustments', requirePermission(['inventory.manage', 'inventory.view', 'reports.view']), validate(getVariantInventorySchema), getVariantAdjustmentsController);

// Adjustment endpoints
router.post('/adjustments', requirePermission('inventory.manage'), validate(adjustInventorySchema), createAdjustmentController);

// Alert endpoints
router.get('/alerts/low-stock', requirePermission(['inventory.manage', 'inventory.view', 'reports.view']), getLowStockAlertsController);
router.get('/alerts/expiring', requirePermission(['inventory.manage', 'inventory.view', 'reports.view']), getExpiringLotsController);

// Receive inventory endpoint
router.post('/receive', requirePermission('inventory.manage'), validate(receiveInventorySchema), receiveInventoryController);

// Stats endpoint
router.get('/stats', requirePermission(['inventory.manage', 'inventory.view', 'reports.view']), getInventoryStatsController);

export default router;
