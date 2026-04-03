package com.possum.persistence.repositories.sqlite;

import com.possum.persistence.db.ConnectionProvider;
import com.possum.persistence.repositories.interfaces.ReportsRepository;
import com.possum.persistence.mappers.SaleMapper;
import com.possum.persistence.mappers.SaleItemMapper;
import com.possum.persistence.mappers.TransactionMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class SqliteReportsRepository extends BaseSqliteRepository implements ReportsRepository {

    private final SaleMapper saleMapper = new SaleMapper();
    private final SaleItemMapper saleItemMapper = new SaleItemMapper();
    private final TransactionMapper transactionMapper = new TransactionMapper();

    public SqliteReportsRepository(ConnectionProvider connectionProvider) {
        super(connectionProvider);
    }

    @Override
    public Map<String, Object> getSalesReportSummary(String startDate, String endDate, List<Long> paymentMethodIds) {
        String paymentFilter = (paymentMethodIds == null || paymentMethodIds.isEmpty()) 
            ? "" 
            : "AND s.id IN (SELECT sale_id FROM transactions WHERE payment_method_id IN (" + buildInPlaceholders(paymentMethodIds.size()) + "))";
        
        String refundPaymentFilter = (paymentMethodIds == null || paymentMethodIds.isEmpty()) 
            ? "" 
            : "AND t.payment_method_id IN (" + buildInPlaceholders(paymentMethodIds.size()) + ")";
        
        List<Object> params = new ArrayList<>();
        // For total_transactions, total_sales, total_tax (with subquery), total_discount (with subquery), total_collected
        for (int i = 0; i < 5; i++) {
            // total_tax (index 2) and total_discount (index 3) now have extra placeholders for their subqueries
            if (i == 2 || i == 3) {
                params.add(startDate);
                params.add(endDate);
                if (paymentMethodIds != null && !paymentMethodIds.isEmpty()) {
                    params.addAll(paymentMethodIds);
                }
            }
            params.add(startDate);
            params.add(endDate);
            if (paymentMethodIds != null && !paymentMethodIds.isEmpty()) {
                params.addAll(paymentMethodIds);
            }
        }
        // For total_refunds
        params.add(startDate);
        params.add(endDate);
        if (paymentMethodIds != null && !paymentMethodIds.isEmpty()) {
            params.addAll(paymentMethodIds);
        }

        return queryOne(
                """
                SELECT
                  (SELECT COUNT(*) FROM sales s WHERE date(s.sale_date) >= ? AND date(s.sale_date) <= ? AND s.status NOT IN ('cancelled', 'draft') %s) AS total_transactions,
                  (SELECT COALESCE(SUM(total_amount), 0) FROM sales s WHERE date(s.sale_date) >= ? AND date(s.sale_date) <= ? AND s.status NOT IN ('cancelled', 'draft') %s) AS total_sales,
                  (SELECT COALESCE(SUM(s.total_tax), 0) + COALESCE((SELECT SUM(si.tax_amount) FROM sale_items si JOIN sales s2 ON si.sale_id = s2.id WHERE date(s2.sale_date) >= ? AND date(s2.sale_date) <= ? AND s2.status NOT IN ('cancelled', 'draft') %s), 0) FROM sales s WHERE date(s.sale_date) >= ? AND date(s.sale_date) <= ? AND s.status NOT IN ('cancelled', 'draft') %s) AS total_tax,
                  (SELECT COALESCE(SUM(s.discount), 0) + COALESCE((SELECT SUM(si.discount_amount) FROM sale_items si JOIN sales s2 ON si.sale_id = s2.id WHERE date(s2.sale_date) >= ? AND date(s2.sale_date) <= ? AND s2.status NOT IN ('cancelled', 'draft') %s), 0) FROM sales s WHERE date(s.sale_date) >= ? AND date(s.sale_date) <= ? AND s.status NOT IN ('cancelled', 'draft') %s) AS total_discount,
                  (SELECT COALESCE(SUM(paid_amount), 0) FROM sales s WHERE date(s.sale_date) >= ? AND date(s.sale_date) <= ? AND s.status NOT IN ('cancelled', 'draft') %s) AS total_collected,
                  (SELECT COALESCE(SUM(ABS(t.amount)), 0) FROM transactions t WHERE t.type = 'refund' AND t.status = 'completed' AND date(t.transaction_date) >= ? AND date(t.transaction_date) <= ? %s) AS total_refunds
                """.formatted(paymentFilter, paymentFilter, paymentFilter, paymentFilter, paymentFilter, paymentFilter, paymentFilter, refundPaymentFilter),
                rs -> {
                    Map<String, Object> map = new HashMap<>();
                    BigDecimal totalSales = rs.getBigDecimal("total_sales");
                    BigDecimal totalTax = rs.getBigDecimal("total_tax");
                    BigDecimal totalRefunds = rs.getBigDecimal("total_refunds");
                    int totalTransactions = rs.getInt("total_transactions");
                    
                    map.put("total_transactions", totalTransactions);
                    map.put("total_sales", totalSales);
                    map.put("total_tax", totalTax);
                    map.put("total_discount", rs.getBigDecimal("total_discount"));
                    map.put("total_collected", rs.getBigDecimal("total_collected"));
                    map.put("total_refunds", totalRefunds);
                    map.put("net_sales", totalSales.subtract(totalTax).subtract(totalRefunds));
                    map.put("average_sale", totalTransactions > 0 
                        ? totalSales.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP) 
                        : BigDecimal.ZERO);
                    return map;
                },
                params.toArray()
        ).orElse(Map.of());
    }

    @Override
    public List<Map<String, Object>> getDailyBreakdown(String startDate, String endDate, List<Long> paymentMethodIds) {
        return groupedBreakdown("date(sale_date)", "date", startDate, endDate, paymentMethodIds);
    }

    @Override
    public List<Map<String, Object>> getMonthlyBreakdown(String startDate, String endDate, List<Long> paymentMethodIds) {
        return groupedBreakdown("strftime('%Y-%m', sale_date)", "month", startDate, endDate, paymentMethodIds);
    }

    @Override
    public List<Map<String, Object>> getYearlyBreakdown(String startDate, String endDate, List<Long> paymentMethodIds) {
        return groupedBreakdown("strftime('%Y', sale_date)", "year", startDate, endDate, paymentMethodIds);
    }

    @Override
    public List<Map<String, Object>> getTopSellingProducts(String startDate, String endDate, int limit, List<Long> paymentMethodIds) {
        String paymentFilter = (paymentMethodIds == null || paymentMethodIds.isEmpty()) 
            ? "" 
            : "AND s.id IN (SELECT sale_id FROM transactions WHERE payment_method_id IN (" + buildInPlaceholders(paymentMethodIds.size()) + "))";
        
        List<Object> params = new ArrayList<>();
        params.add(startDate);
        params.add(endDate);
        if (paymentMethodIds != null && !paymentMethodIds.isEmpty()) {
            params.addAll(paymentMethodIds);
        }
        params.add(limit);
        
        return queryList(
                """
                SELECT
                  p.id AS product_id,
                  p.name AS product_name,
                  v.name AS variant_name,
                  v.sku,
                  SUM(si.quantity) AS total_quantity_sold,
                  SUM(si.quantity * si.price_per_unit) AS total_revenue
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                JOIN variants v ON si.variant_id = v.id
                JOIN products p ON v.product_id = p.id
                WHERE date(s.sale_date) >= ? AND date(s.sale_date) <= ?
                  AND s.status NOT IN ('cancelled', 'draft')
                  %s
                GROUP BY v.id, p.id, p.name, v.name, v.sku
                ORDER BY total_quantity_sold DESC
                LIMIT ?
                """.formatted(paymentFilter),
                rs -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("product_id", rs.getLong("product_id"));
                    map.put("product_name", rs.getString("product_name"));
                    map.put("variant_name", rs.getString("variant_name"));
                    map.put("sku", rs.getString("sku"));
                    map.put("total_quantity_sold", rs.getInt("total_quantity_sold"));
                    map.put("total_revenue", rs.getBigDecimal("total_revenue"));
                    return map;
                },
                params.toArray()
        );
    }

    @Override
    public List<Map<String, Object>> getSalesByPaymentMethod(String startDate, String endDate) {
        return queryList(
                """
                SELECT
                  pm.name AS payment_method,
                  COUNT(t.id) AS total_transactions,
                  COALESCE(SUM(t.amount), 0) AS total_amount
                FROM transactions t
                JOIN payment_methods pm ON t.payment_method_id = pm.id
                WHERE date(t.transaction_date) >= ? AND date(t.transaction_date) <= ?
                  AND t.status = 'completed'
                  AND t.type = 'payment'
                GROUP BY pm.name
                """,
                rs -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("payment_method", rs.getString("payment_method"));
                    map.put("total_transactions", rs.getInt("total_transactions"));
                    map.put("total_amount", rs.getBigDecimal("total_amount"));
                    return map;
                },
                startDate,
                endDate
        );
    }

    @Override
    public Map<String, Object> getBusinessHealthOverview(String startDate, String endDate) {
        Map<String, Object> salesSummary = getSalesReportSummary(startDate, endDate, null);
        
        Map<String, Object> stockCounts = queryOne(
                """
                SELECT 
                    COUNT(CASE WHEN (SELECT SUM(remaining_quantity) FROM inventory_lots WHERE variant_id = v.id) <= v.stock_alert_cap AND (SELECT SUM(remaining_quantity) FROM inventory_lots WHERE variant_id = v.id) > 0 THEN 1 END) as low_stock,
                    COUNT(CASE WHEN (SELECT SUM(remaining_quantity) FROM inventory_lots WHERE variant_id = v.id) <= 0 OR (SELECT SUM(remaining_quantity) FROM inventory_lots WHERE variant_id = v.id) IS NULL THEN 1 END) as out_of_stock
                FROM variants v
                WHERE v.status = 'active'
                """,
                rs -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("low_stock_count", rs.getInt("low_stock"));
                    m.put("out_of_stock_count", rs.getInt("out_of_stock"));
                    return m;
                }
        ).orElse(Map.of("low_stock_count", 0, "out_of_stock_count", 0));

        Map<String, Object> result = new HashMap<>(salesSummary);
        result.putAll(stockCounts);
        return result;
    }

    @Override
    public List<Map<String, Object>> getStockMovementSummary(String startDate, String endDate, Long categoryId) {
        String categoryFilter = categoryId == null ? "" : "AND p.category_id = ?";
        Object[] params = categoryId == null ? new Object[]{startDate, endDate} : new Object[]{startDate, endDate, categoryId};
        
        return queryList(
                """
                SELECT 
                    p.name AS product_name,
                    v.name AS variant_name,
                    v.sku,
                    SUM(CASE WHEN pf.event_type = 'PURCHASE' OR pf.event_type = 'RECEIVE' THEN pf.quantity ELSE 0 END) AS incoming,
                    SUM(CASE WHEN pf.event_type = 'SALE' THEN ABS(pf.quantity) ELSE 0 END) AS outgoing,
                    SUM(CASE WHEN pf.event_type = 'RETURN' THEN pf.quantity ELSE 0 END) AS returns,
                    SUM(CASE WHEN pf.event_type = 'ADJUSTMENT' THEN pf.quantity ELSE 0 END) AS adjustments,
                    (SELECT COALESCE(SUM(remaining_quantity), 0) FROM inventory_lots WHERE variant_id = v.id) AS current_stock
                FROM product_flow pf
                JOIN variants v ON pf.variant_id = v.id
                JOIN products p ON v.product_id = p.id
                WHERE date(pf.event_date) >= ? AND date(pf.event_date) <= ?
                  %s
                GROUP BY v.id
                ORDER BY outgoing DESC
                """.formatted(categoryFilter),
                rs -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("product_name", rs.getString("product_name"));
                    m.put("variant_name", rs.getString("variant_name"));
                    m.put("sku", rs.getString("sku"));
                    m.put("incoming", rs.getInt("incoming"));
                    m.put("outgoing", rs.getInt("outgoing"));
                    m.put("returns", rs.getInt("returns"));
                    m.put("adjustments", rs.getInt("adjustments"));
                    m.put("current_stock", rs.getInt("current_stock"));
                    return m;
                },
                params
        );
    }

    private List<Map<String, Object>> groupedBreakdown(String expression,
                                                       String alias,
                                                       String startDate,
                                                       String endDate,
                                                       List<Long> paymentMethodIds) {
        String paymentFilter = (paymentMethodIds == null || paymentMethodIds.isEmpty()) 
            ? "" 
            : "AND s.id IN (SELECT sale_id FROM transactions WHERE payment_method_id IN (" + buildInPlaceholders(paymentMethodIds.size()) + "))";
        
        List<Object> params = new ArrayList<>();
        params.add(startDate);
        params.add(endDate);
        if (paymentMethodIds != null && !paymentMethodIds.isEmpty()) {
            params.addAll(paymentMethodIds);
        }
        
        return queryList(
                """
                SELECT
                  %s AS %s,
                  COUNT(DISTINCT s.id) AS total_transactions,
                  COALESCE(SUM(s.total_amount), 0) AS total_sales,
                   COALESCE(SUM(s.total_tax), 0) + COALESCE(SUM((SELECT SUM(si.tax_amount) FROM sale_items si WHERE si.sale_id = s.id)), 0) AS total_tax,
                  COALESCE(SUM(s.discount), 0) + COALESCE(SUM((SELECT SUM(si.discount_amount) FROM sale_items si WHERE si.sale_id = s.id)), 0) AS total_discount,
                  COALESCE(SUM((SELECT SUM(t.amount) FROM transactions t JOIN payment_methods pm ON t.payment_method_id = pm.id WHERE t.sale_id = s.id AND pm.name = 'Cash' AND t.status = 'completed' AND t.type = 'payment')), 0) AS cash,
                  COALESCE(SUM((SELECT SUM(t.amount) FROM transactions t JOIN payment_methods pm ON t.payment_method_id = pm.id WHERE t.sale_id = s.id AND pm.name = 'UPI' AND t.status = 'completed' AND t.type = 'payment')), 0) AS upi,
                  COALESCE(SUM((SELECT SUM(t.amount) FROM transactions t JOIN payment_methods pm ON t.payment_method_id = pm.id WHERE t.sale_id = s.id AND pm.name = 'Debit Card' AND t.status = 'completed' AND t.type = 'payment')), 0) AS debit_card,
                  COALESCE(SUM((SELECT SUM(t.amount) FROM transactions t JOIN payment_methods pm ON t.payment_method_id = pm.id WHERE t.sale_id = s.id AND pm.name = 'Credit Card' AND t.status = 'completed' AND t.type = 'payment')), 0) AS credit_card,
                  COALESCE(SUM((SELECT SUM(t.amount) FROM transactions t JOIN payment_methods pm ON t.payment_method_id = pm.id WHERE t.sale_id = s.id AND pm.name = 'Gift Card' AND t.status = 'completed' AND t.type = 'payment')), 0) AS gift_card,
                  COALESCE(SUM((SELECT SUM(ABS(t.amount)) FROM transactions t WHERE t.sale_id = s.id AND t.type = 'refund' AND t.status = 'completed')), 0) AS refunds
                FROM sales s
                WHERE date(sale_date) >= ? AND date(sale_date) <= ?
                  AND status NOT IN ('cancelled', 'draft')
                  %s
                GROUP BY %s
                ORDER BY %s ASC
                """.formatted(expression, alias, paymentFilter, expression, alias),
                rs -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put(alias, rs.getString(alias));
                    map.put("total_transactions", rs.getInt("total_transactions"));
                    map.put("total_sales", rs.getBigDecimal("total_sales"));
                    map.put("total_tax", rs.getBigDecimal("total_tax"));
                    map.put("total_discount", rs.getBigDecimal("total_discount"));
                    map.put("cash", rs.getBigDecimal("cash"));
                    map.put("upi", rs.getBigDecimal("upi"));
                    map.put("debit_card", rs.getBigDecimal("debit_card"));
                    map.put("credit_card", rs.getBigDecimal("credit_card"));
                    map.put("gift_card", rs.getBigDecimal("gift_card"));
                    map.put("refunds", rs.getBigDecimal("refunds"));
                    return map;
                },
                params.toArray()
        );
    }
    
    private String buildInPlaceholders(int count) {
        if (count <= 0) return "";
        return "?,".repeat(count).replaceAll(",$", "");
    }
}
