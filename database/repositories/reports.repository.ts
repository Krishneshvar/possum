/**
 * Reports Repository
 * Handles all database operations for sales reporting
 */
import { getDB } from '../../electron/backend/shared/db/index.js';
import { SalesReportSummary, TopProduct, PaymentMethodStat } from '../../types/index.js';
import type { IReportsRepository } from '../../core/index.js';

export class ReportsRepository implements IReportsRepository {
    /**
     * Get sales report summary for a date range
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {SalesReportSummary} Summary report
     */
    getSalesReportSummary(startDate: string, endDate: string): SalesReportSummary {
        const db = getDB();
        return db.prepare(`
        SELECT 
            COUNT(*) as total_transactions,
            COALESCE(SUM(total_amount), 0) as total_sales,
            COALESCE(SUM(total_tax), 0) as total_tax,
            COALESCE(SUM(discount), 0) as total_discount,
            COALESCE(SUM(paid_amount), 0) as total_collected,
            COALESCE(SUM(total_amount) - SUM(total_tax), 0) as net_sales,
            CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*) ELSE 0 END as average_sale
        FROM sales
        WHERE date(sale_date) >= ? AND date(sale_date) <= ?
          AND status NOT IN ('cancelled', 'draft')
    `).get(startDate, endDate) as SalesReportSummary;
    }

    /**
     * Get daily breakdown for a date range
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Array} Daily breakdown
     */
    getDailyBreakdown(startDate: string, endDate: string): any[] {
        const db = getDB();
        return db.prepare(`
        SELECT 
            date(sale_date) as date,
            COUNT(*) as total_transactions,
            COALESCE(SUM(total_amount), 0) as total_sales,
            COALESCE(SUM(total_tax), 0) as total_tax,
            COALESCE(SUM(discount), 0) as total_discount
        FROM sales
        WHERE date(sale_date) >= ? AND date(sale_date) <= ?
          AND status NOT IN ('cancelled', 'draft')
        GROUP BY date(sale_date)
        ORDER BY date ASC
    `).all(startDate, endDate);
    }

    /**
     * Get monthly breakdown for a date range
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Array} Monthly breakdown
     */
    getMonthlyBreakdown(startDate: string, endDate: string): any[] {
        const db = getDB();
        return db.prepare(`
        SELECT 
            strftime('%Y-%m', sale_date) as month,
            COUNT(*) as total_transactions,
            COALESCE(SUM(total_amount), 0) as total_sales,
            COALESCE(SUM(total_tax), 0) as total_tax,
            COALESCE(SUM(discount), 0) as total_discount
        FROM sales
        WHERE date(sale_date) >= ? AND date(sale_date) <= ?
          AND status NOT IN ('cancelled', 'draft')
        GROUP BY strftime('%Y-%m', sale_date)
        ORDER BY month ASC
    `).all(startDate, endDate);
    }

    /**
     * Get yearly breakdown for a date range
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Array} Yearly breakdown
     */
    getYearlyBreakdown(startDate: string, endDate: string): any[] {
        const db = getDB();
        return db.prepare(`
        SELECT 
            strftime('%Y', sale_date) as year,
            COUNT(*) as total_transactions,
            COALESCE(SUM(total_amount), 0) as total_sales,
            COALESCE(SUM(total_tax), 0) as total_tax,
            COALESCE(SUM(discount), 0) as total_discount
        FROM sales
        WHERE date(sale_date) >= ? AND date(sale_date) <= ?
          AND status NOT IN ('cancelled', 'draft')
        GROUP BY strftime('%Y', sale_date)
        ORDER BY year ASC
    `).all(startDate, endDate);
    }

    /**
     * Get top selling products for a period
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @param {number} limit - Number of products
     * @returns {Array} Top products
     */
    getTopSellingProducts(startDate: string, endDate: string, limit: number = 10): TopProduct[] {
        const db = getDB();
        return db.prepare(`
        SELECT 
            p.id as product_id,
            p.name as product_name,
            v.name as variant_name,
            v.sku,
            SUM(si.quantity) as total_quantity_sold,
            SUM(si.quantity * si.price_per_unit) as total_revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE s.sale_date >= ? AND s.sale_date <= ?
          AND s.status NOT IN ('cancelled', 'draft')
        GROUP BY v.id
        ORDER BY total_quantity_sold DESC
        LIMIT ?
    `).all(startDate, endDate, limit) as TopProduct[];
    }

    /**
     * Get sales by payment method
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Array} Sales by payment method
     */
    getSalesByPaymentMethod(startDate: string, endDate: string): PaymentMethodStat[] {
        const db = getDB();
        return db.prepare(`
        SELECT 
            pm.name as payment_method,
            COUNT(t.id) as total_transactions,
            COALESCE(SUM(t.amount), 0) as total_amount
        FROM transactions t
        JOIN payment_methods pm ON t.payment_method_id = pm.id
        WHERE date(t.transaction_date) >= ? AND date(t.transaction_date) <= ?
          AND t.status = 'completed'
          AND t.type = 'payment'
        GROUP BY pm.name
    `).all(startDate, endDate) as PaymentMethodStat[];
    }
}
