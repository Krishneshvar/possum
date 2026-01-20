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

const router = Router();

// Variant stock endpoints
router.get('/variants/:id/stock', getVariantStockController);
router.get('/variants/:id/lots', getVariantLotsController);
router.get('/variants/:id/adjustments', getVariantAdjustmentsController);

// Adjustment endpoints
router.post('/adjustments', createAdjustmentController);

// Alert endpoints
router.get('/alerts/low-stock', getLowStockAlertsController);
router.get('/alerts/expiring', getExpiringLotsController);

// Receive inventory endpoint
router.post('/receive', receiveInventoryController);

// Stats endpoint
router.get('/stats', getInventoryStatsController);

export default router;
