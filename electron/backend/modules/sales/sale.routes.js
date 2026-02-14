import { Router } from 'express';
import * as SaleController from './sale.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Payment Methods
router.get('/payment-methods', requirePermission('COMPLETE_SALE'), SaleController.getPaymentMethods);

// Main Sales Routes
router.get('/', requirePermission(['VIEW_REPORTS', 'COMPLETE_SALE']), SaleController.getSales);
router.post('/', requirePermission('COMPLETE_SALE'), SaleController.createSale);
router.get('/:id', requirePermission(['VIEW_REPORTS', 'COMPLETE_SALE']), SaleController.getSale);
router.put('/:id', requirePermission(['VOID_INVOICE', 'COMPLETE_SALE']), SaleController.updateSale);
router.delete('/:id', requirePermission('VOID_INVOICE'), SaleController.deleteSale);

// Fulfillment
router.put('/:id/fulfill', requirePermission('COMPLETE_SALE'), SaleController.fulfillSale);

// Add Payment
router.post('/:id/payments', requirePermission('COMPLETE_SALE'), SaleController.addPayment);

export default router;
