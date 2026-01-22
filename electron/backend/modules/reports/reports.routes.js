/**
 * Reports Routes
 * Defines API routes for sales reporting
 */
import { Router } from 'express';
import * as reportsController from './reports.controller.js';

const router = Router();

router.get('/daily', reportsController.getDailyReportController);
router.get('/monthly', reportsController.getMonthlyReportController);
router.get('/yearly', reportsController.getYearlyReportController);
router.get('/top-products', reportsController.getTopProductsController);
router.get('/payment-methods', reportsController.getSalesByPaymentMethodController);

export default router;
