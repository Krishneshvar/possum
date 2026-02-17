import { Router } from 'express';
import * as SaleController from './sale.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Payment Methods
router.get('/payment-methods', requirePermission('sales.create'), SaleController.getPaymentMethods);

// Main Sales Routes
router.get('/', requirePermission(['reports.view', 'sales.create']), SaleController.getSales);
router.post('/', requirePermission('sales.create'), SaleController.createSale);
router.get('/:id', requirePermission(['reports.view', 'sales.create']), SaleController.getSale);
router.put('/:id', requirePermission(['sales.refund', 'sales.create']), SaleController.updateSale);
router.delete('/:id', requirePermission('sales.refund'), SaleController.deleteSale);

// Fulfillment
router.put('/:id/fulfill', requirePermission('sales.create'), SaleController.fulfillSale);

// Add Payment
router.post('/:id/payments', requirePermission('sales.create'), SaleController.addPayment);

export default router;
