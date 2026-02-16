/**
 * Return Routes
 * Defines API routes for returns
 */
import { Router } from 'express';
import {
    createReturnController,
    getReturnController,
    getSaleReturnsController,
    getReturnsController
} from './return.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Create return
router.post('/', requirePermission('sales.refund'), createReturnController);

// Get return details
router.get('/:id', requirePermission('sales.refund'), getReturnController);

// Get returns for a sale
router.get('/sale/:saleId', requirePermission('sales.refund'), getSaleReturnsController);

// Get returns list
router.get('/', requirePermission('sales.refund'), getReturnsController);

export default router;
