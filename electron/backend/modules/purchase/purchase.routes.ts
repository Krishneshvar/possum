/**
 * Purchase Routes
 * API endpoints for purchase orders
 */
import { Router } from 'express';
import * as purchaseController from './purchase.controller.js';

const router = Router();

router.get('/', purchaseController.getPurchaseOrders);
router.get('/:id', purchaseController.getPurchaseOrderById);
router.post('/', purchaseController.createPurchaseOrder);
router.post('/:id/receive', purchaseController.receivePurchaseOrder);
router.post('/:id/cancel', purchaseController.cancelPurchaseOrder);

export default router;
