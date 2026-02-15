/**
 * Reports Routes
 * Defines API routes for sales reporting
 */
import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/daily', requirePermission('reports.view'), reportsController.getDailyReportController);
router.get('/monthly', requirePermission('reports.view'), reportsController.getMonthlyReportController);
router.get('/yearly', requirePermission('reports.view'), reportsController.getYearlyReportController);
router.get('/top-products', requirePermission('reports.view'), reportsController.getTopProductsController);
router.get('/payment-methods', requirePermission('reports.view'), reportsController.getSalesByPaymentMethodController);

export default router;
