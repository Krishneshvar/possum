/**
 * Reports Controller
 * Handles HTTP requests for sales reporting
 */
import * as reportsService from './reports.service.js';

/**
 * GET /api/reports/daily
 * Get daily sales report
 */
export async function getDailyReportController(req, res) {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: 'date parameter is required (YYYY-MM-DD).' });
        }

        const report = reportsService.getDailyReport(date);
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
export async function getMonthlyReportController(req, res) {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ error: 'year and month parameters are required.' });
        }

        const report = reportsService.getMonthlyReport(parseInt(year, 10), parseInt(month, 10));
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
export async function getYearlyReportController(req, res) {
    try {
        const { year } = req.query;
        if (!year) {
            return res.status(400).json({ error: 'year parameter is required.' });
        }

        const report = reportsService.getYearlyReport(parseInt(year, 10));
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
export async function getTopProductsController(req, res) {
    try {
        const { startDate, endDate, limit = 10 } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate parameters are required.' });
        }

        const products = reportsService.getTopProducts(startDate, endDate, parseInt(limit, 10));
        res.json(products);
    } catch (err) {
        console.error('Error fetching top products:', err);
        res.status(500).json({ error: 'Failed to retrieve top products.' });
    }
}
