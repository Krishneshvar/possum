import { SalesReportSummary, TopProduct, PaymentMethodStat } from '../../../types/index.js';

export interface IReportsRepository {
    getSalesReportSummary(startDate: string, endDate: string, paymentMethodId?: number): SalesReportSummary;
    getDailyBreakdown(startDate: string, endDate: string, paymentMethodId?: number): any[];
    getMonthlyBreakdown(startDate: string, endDate: string, paymentMethodId?: number): any[];
    getYearlyBreakdown(startDate: string, endDate: string, paymentMethodId?: number): any[];
    getTopSellingProducts(startDate: string, endDate: string, limit: number, paymentMethodId?: number): TopProduct[];
    getSalesByPaymentMethod(startDate: string, endDate: string): PaymentMethodStat[];
}
