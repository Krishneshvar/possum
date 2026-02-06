/**
 * Sale Routes
 * Defines API routes for sales operations
 */
import { Router } from 'express';
import {
    createSaleController,
    getSalesController,
    getSaleController,
    addPaymentController,
    cancelSaleController,
    getPaymentMethodsController,
    fulfillSaleController
} from './sale.controller.js';

const router = Router();

// Payment methods - must be before :id route
router.get('/payment-methods', getPaymentMethodsController);

// Sales CRUD
router.post('/', createSaleController);
router.get('/', getSalesController);
router.get('/:id', getSaleController);

// Sale actions
router.post('/:id/payments', addPaymentController);
router.put('/:id/cancel', cancelSaleController);
router.put('/:id/fulfill', fulfillSaleController);

export default router;
