import { SalesReportSummary, TopProduct, PaymentMethodStat } from '../../../types/index.js';

export interface IReportsRepository {
    getSalesReportSummary(startDate: string, endDate: string): SalesReportSummary;
    getDailyBreakdown(startDate: string, endDate: string): any[];
    getMonthlyBreakdown(startDate: string, endDate: string): any[];
    getYearlyBreakdown(startDate: string, endDate: string): any[];
    getTopSellingProducts(startDate: string, endDate: string, limit: number): TopProduct[];
    getSalesByPaymentMethod(startDate: string, endDate: string): PaymentMethodStat[];
}
