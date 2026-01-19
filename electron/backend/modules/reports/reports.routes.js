/**
 * Reports Routes
 * Defines API routes for sales reporting
 */
import { Router } from 'express';
import {
    getDailyReportController,
    getMonthlyReportController,
    getYearlyReportController,
    getTopProductsController
} from './reports.controller.js';

const router = Router();

router.get('/daily', getDailyReportController);
router.get('/monthly', getMonthlyReportController);
router.get('/yearly', getYearlyReportController);
router.get('/top-products', getTopProductsController);

export default router;
