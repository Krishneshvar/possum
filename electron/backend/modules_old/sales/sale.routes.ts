import { Router } from 'express';
import * as SaleController from './sale.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createSaleSchema, addPaymentSchema, getSaleSchema, updateSaleSchema } from './sale.schema.js';

const router = Router();

// Payment Methods
router.get('/payment-methods', requirePermission('sales.create'), SaleController.getPaymentMethods);

// Main Sales Routes
router.get('/', requirePermission(['sales.view', 'sales.create']), SaleController.getSales);
router.post('/', requirePermission('sales.create'), validate(createSaleSchema), SaleController.createSale);
router.get('/:id', requirePermission(['sales.view', 'sales.create']), validate(getSaleSchema), SaleController.getSale);
router.put('/:id', requirePermission(['sales.manage', 'sales.refund']), validate(updateSaleSchema), SaleController.updateSale);
router.delete('/:id', requirePermission(['sales.manage', 'sales.refund']), validate(getSaleSchema), SaleController.deleteSale);

// Fulfillment
router.put('/:id/fulfill', requirePermission(['sales.create', 'sales.manage']), validate(getSaleSchema), SaleController.fulfillSale);

// Add Payment
router.post('/:id/payments', requirePermission(['sales.create', 'sales.manage']), validate(addPaymentSchema), SaleController.addPayment);

export default router;
