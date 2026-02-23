/**
 * Reports Service
 * Contains business logic for sales reporting
 */
import { IReportsRepository } from './reports.repository.interface.js';
import { DailyReport, MonthlyReport, YearlyReport, TopProduct, PaymentMethodStat } from '../../../types/index.js';

let reportsRepository: IReportsRepository;

export function initReportsService(repo: IReportsRepository) {
  reportsRepository = repo;
}

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
    const breakdown = reportsRepository.getDailyBreakdownForMonth(year, month).map(item => ({
        ...item,
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: item.total_sales
    }));

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
    const breakdown = reportsRepository.getMonthlyBreakdownForYear(year).map(item => ({
        ...item,
        name: new Date(2000, parseInt(item.month) - 1, 1).toLocaleDateString('en-US', { month: 'short' }),
        sales: item.total_sales
    }));

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


