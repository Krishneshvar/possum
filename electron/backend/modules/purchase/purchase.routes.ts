/**
 * Purchase Routes
 * API endpoints for purchase orders
 */
import { Router } from 'express';
import * as purchaseController from './purchase.controller.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';
import { createPurchaseOrderSchema, getPurchaseOrderSchema, getPurchaseOrdersSchema } from './purchase.schema.js';

const router = Router();

router.get('/', requirePermission('purchase.manage'), validate(getPurchaseOrdersSchema), purchaseController.getPurchaseOrders);
router.get('/:id', requirePermission('purchase.manage'), validate(getPurchaseOrderSchema), purchaseController.getPurchaseOrderById);
router.post('/', requirePermission('purchase.manage'), validate(createPurchaseOrderSchema), purchaseController.createPurchaseOrder);
router.post('/:id/receive', requirePermission('purchase.manage'), validate(getPurchaseOrderSchema), purchaseController.receivePurchaseOrder);
router.post('/:id/cancel', requirePermission('purchase.manage'), validate(getPurchaseOrderSchema), purchaseController.cancelPurchaseOrder);

export default router;
