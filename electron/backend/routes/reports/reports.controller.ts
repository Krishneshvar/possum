/**
 * Reports Controller
 * Handles HTTP requests for sales reporting
 */
import { Request, Response } from 'express';
import * as reportsService from '../../../../core/index.js';

/**
 * GET /api/reports/daily
 * Get daily sales report
 */
export async function getDailyReportController(req: Request, res: Response) {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
            return res.status(400).json({ error: 'startDate and endDate parameters are required (YYYY-MM-DD).' });
        }

        const report = reportsService.getDailyReport(startDate, endDate);
        res.json(report);
    } catch (err) {
        console.error('Error fetching daily report:', err);
        res.status(500).json({ error: 'Failed to retrieve daily report.' });
    }
}

/**
 * GET /api/reports/monthly
 * Get monthly sales report
 */
export async function getMonthlyReportController(req: Request, res: Response) {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
            return res.status(400).json({ error: 'startDate and endDate parameters are required (YYYY-MM-DD).' });
        }

        const report = reportsService.getMonthlyReport(startDate, endDate);
        res.json(report);
    } catch (err) {
        console.error('Error fetching monthly report:', err);
        res.status(500).json({ error: 'Failed to retrieve monthly report.' });
    }
}

/**
 * GET /api/reports/yearly
 * Get yearly sales report
 */
export async function getYearlyReportController(req: Request, res: Response) {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
            return res.status(400).json({ error: 'startDate and endDate parameters are required (YYYY-MM-DD).' });
        }

        const report = reportsService.getYearlyReport(startDate, endDate);
        res.json(report);
    } catch (err) {
        console.error('Error fetching yearly report:', err);
        res.status(500).json({ error: 'Failed to retrieve yearly report.' });
    }
}

/**
 * GET /api/reports/top-products
 * Get top selling products
 */
export async function getTopProductsController(req: Request, res: Response) {
    try {
        const { startDate, endDate, limit = '10' } = req.query;
        if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
            return res.status(400).json({ error: 'startDate and endDate parameters are required.' });
        }

        const products = reportsService.getTopProducts(startDate, endDate, parseInt(limit as string, 10));
        res.json(products);
    } catch (err) {
        console.error('Error fetching top products:', err);
        res.status(500).json({ error: 'Failed to retrieve top products.' });
    }
}


/**
 * GET /api/reports/payment-methods
 * Get sales by payment method
 */
export async function getSalesByPaymentMethodController(req: Request, res: Response) {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
            return res.status(400).json({ error: 'startDate and endDate parameters are required.' });
        }

        const data = reportsService.getSalesByPaymentMethod(startDate, endDate);
        res.json(data);
    } catch (err) {
        console.error('Error fetching sales by payment method:', err);
        res.status(500).json({ error: 'Failed to retrieve sales by payment method.' });
    }
}
