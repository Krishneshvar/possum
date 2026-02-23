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
router.post('/', requirePermission(['sales.refund', 'returns.manage']), validate(createReturnSchema), createReturnController);

// Get returns for a sale
router.get('/sale/:saleId', requirePermission(['sales.refund', 'returns.view', 'returns.manage']), validate(getSaleReturnsSchema), getSaleReturnsController);

// Get returns list
router.get('/', requirePermission(['returns.view', 'returns.manage', 'sales.refund']), validate(getReturnsQuerySchema), getReturnsController);

// Get return details
router.get('/:id', requirePermission(['returns.view', 'returns.manage', 'sales.refund']), validate(getReturnSchema), getReturnController);

export default router;
