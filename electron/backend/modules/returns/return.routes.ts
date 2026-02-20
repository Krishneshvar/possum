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
import { validate } from '../../shared/middleware/validate.middleware.js';
import {
    createReturnSchema,
    getReturnSchema,
    getSaleReturnsSchema,
    getReturnsQuerySchema
} from './return.schema.js';

const router = Router();

// Create return
router.post('/', requirePermission('sales.refund'), validate(createReturnSchema), createReturnController);

// Get returns for a sale
router.get('/sale/:saleId', requirePermission('sales.refund'), validate(getSaleReturnsSchema), getSaleReturnsController);

// Get returns list
router.get('/', requirePermission('sales.refund'), validate(getReturnsQuerySchema), getReturnsController);

// Get return details
router.get('/:id', requirePermission('sales.refund'), validate(getReturnSchema), getReturnController);

export default router;
