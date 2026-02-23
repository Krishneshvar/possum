import { SalesReportSummary, TopProduct, PaymentMethodStat } from '../../../types/index.js';

export interface IReportsRepository {
    getDailySalesReport(date: string): SalesReportSummary;
    getMonthlySalesReport(year: number, month: number): SalesReportSummary;
    getYearlySalesReport(year: number): SalesReportSummary;
    getDailyBreakdownForMonth(year: number, month: number): any[];
    getMonthlyBreakdownForYear(year: number): any[];
    getTopSellingProducts(startDate: string, endDate: string, limit: number): TopProduct[];
    getSalesByPaymentMethod(startDate: string, endDate: string): PaymentMethodStat[];
}
