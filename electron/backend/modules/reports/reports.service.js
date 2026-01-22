/**
 * Reports Service
 * Contains business logic for sales reporting
 */
import * as reportsRepository from './reports.repository.js';

/**
 * Get daily sales report
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Daily report
 */
export function getDailyReport(date) {
    const report = reportsRepository.getDailySalesReport(date);
    return {
        date,
        reportType: 'daily',
        ...report
    };
}

/**
 * Get monthly sales report
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} Monthly report with daily breakdown
 */
export function getMonthlyReport(year, month) {
    const summary = reportsRepository.getMonthlySalesReport(year, month);
    const breakdown = reportsRepository.getDailyBreakdownForMonth(year, month);

    return {
        year,
        month,
        reportType: 'monthly',
        summary,
        breakdown
    };
}

/**
 * Get yearly sales report
 * @param {number} year - Year
 * @returns {Object} Yearly report with monthly breakdown
 */
export function getYearlyReport(year) {
    const summary = reportsRepository.getYearlySalesReport(year);
    const breakdown = reportsRepository.getMonthlyBreakdownForYear(year);

    return {
        year,
        reportType: 'yearly',
        summary,
        breakdown
    };
}

/**
 * Get top selling products
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {number} limit - Number of products
 * @returns {Array} Top products
 */
export function getTopProducts(startDate, endDate, limit = 10) {
    return reportsRepository.getTopSellingProducts(startDate, endDate, limit);
}

/**
 * Get sales by payment method
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Array} Sales by payment method
 */
export function getSalesByPaymentMethod(startDate, endDate) {
    return reportsRepository.getSalesByPaymentMethod(startDate, endDate);
}

/**
 * Cache a report for faster retrieval
 * @param {string} reportType - Report type (daily/monthly/yearly)
 * @param {string} periodStart - Period start date
 * @param {string} periodEnd - Period end date
 * @param {Object} data - Report data
 */
export function cacheReport(reportType, periodStart, periodEnd, data) {
    return reportsRepository.upsertSalesReport({
        report_type: reportType,
        period_start: periodStart,
        period_end: periodEnd,
        total_sales: data.total_sales,
        total_tax: data.total_tax,
        total_discount: data.total_discount,
        total_transactions: data.total_transactions
    });
}
