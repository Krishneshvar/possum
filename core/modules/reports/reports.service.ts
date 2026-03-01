/**
 * Reports Service
 * Contains business logic for sales reporting
 */
import { IReportsRepository } from './reports.repository.interface.js';
import { DailyReport, MonthlyReport, YearlyReport, TopProduct, PaymentMethodStat } from '../../../models/index.js';

let reportsRepository: IReportsRepository;

export function initReportsService(repo: IReportsRepository) {
    reportsRepository = repo;
}

/**
 * Get daily sales report breakdown over a date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {DailyReport} Daily report
 */
export function getDailyReport(startDate: string, endDate: string, paymentMethodId?: number): DailyReport {
    const summary = reportsRepository.getSalesReportSummary(startDate, endDate, paymentMethodId);
    const breakdown = reportsRepository.getDailyBreakdown(startDate, endDate, paymentMethodId).map(item => ({
        ...item,
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        sales: item.total_sales
    }));

    return {
        startDate,
        endDate,
        reportType: 'daily',
        summary,
        breakdown
    };
}

/**
 * Get monthly sales report over a date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {MonthlyReport} Monthly report with monthly breakdown
 */
export function getMonthlyReport(startDate: string, endDate: string, paymentMethodId?: number): MonthlyReport {
    const summary = reportsRepository.getSalesReportSummary(startDate, endDate, paymentMethodId);
    const breakdown = reportsRepository.getMonthlyBreakdown(startDate, endDate, paymentMethodId).map(item => ({
        ...item,
        name: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        sales: item.total_sales
    }));

    return {
        startDate,
        endDate,
        reportType: 'monthly',
        summary,
        breakdown
    };
}

/**
 * Get yearly sales report over a date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {YearlyReport} Yearly report with yearly breakdown
 */
export function getYearlyReport(startDate: string, endDate: string, paymentMethodId?: number): YearlyReport {
    const summary = reportsRepository.getSalesReportSummary(startDate, endDate, paymentMethodId);
    const breakdown = reportsRepository.getYearlyBreakdown(startDate, endDate, paymentMethodId).map(item => ({
        ...item,
        name: item.year,
        sales: item.total_sales
    }));

    return {
        startDate,
        endDate,
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
export function getTopProducts(startDate: string, endDate: string, limit: number = 10, paymentMethodId?: number): TopProduct[] {
    return reportsRepository.getTopSellingProducts(startDate, endDate, limit, paymentMethodId);
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


