/**
 * Reports Service
 * Contains business logic for sales reporting
 */
import * as reportsRepository from './reports.repository.js';
import { DailyReport, MonthlyReport, YearlyReport, TopProduct, PaymentMethodStat } from '../../../../types/index.js';

/**
 * Get daily sales report
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {DailyReport} Daily report
 */
export function getDailyReport(date: string): DailyReport {
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
 * @returns {MonthlyReport} Monthly report with daily breakdown
 */
export function getMonthlyReport(year: number, month: number): MonthlyReport {
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
 * @returns {YearlyReport} Yearly report with monthly breakdown
 */
export function getYearlyReport(year: number): YearlyReport {
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
 * @returns {TopProduct[]} Top products
 */
export function getTopProducts(startDate: string, endDate: string, limit: number = 10): TopProduct[] {
    return reportsRepository.getTopSellingProducts(startDate, endDate, limit);
}

/**
 * Get sales by payment method
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {PaymentMethodStat[]} Sales by payment method
 */
export function getSalesByPaymentMethod(startDate: string, endDate: string): PaymentMethodStat[] {
    return reportsRepository.getSalesByPaymentMethod(startDate, endDate);
}

interface CacheReportData {
    total_sales: number;
    total_tax: number;
    total_discount: number;
    total_transactions: number;
}

/**
 * Cache a report for faster retrieval
 * @param {string} reportType - Report type (daily/monthly/yearly)
 * @param {string} periodStart - Period start date
 * @param {string} periodEnd - Period end date
 * @param {CacheReportData} data - Report data
 */
export function cacheReport(reportType: string, periodStart: string, periodEnd: string, data: CacheReportData) {
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
