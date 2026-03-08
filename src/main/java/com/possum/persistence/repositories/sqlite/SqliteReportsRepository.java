package com.possum.persistence.repositories.sqlite;

import com.possum.persistence.db.ConnectionProvider;
import com.possum.persistence.repositories.interfaces.ReportsRepository;

import java.util.List;
import java.util.Map;

public final class SqliteReportsRepository extends BaseSqliteRepository implements ReportsRepository {

    public SqliteReportsRepository(ConnectionProvider connectionProvider) {
        super(connectionProvider);
    }

    @Override
    public Map<String, Object> getSalesReportSummary(String startDate, String endDate, Long paymentMethodId) {
        String paymentFilter = paymentMethodId == null ? "" : "AND s.id IN (SELECT sale_id FROM transactions WHERE payment_method_id = ?)";
        Object[] params = paymentMethodId == null ? new Object[]{startDate, endDate} : new Object[]{startDate, endDate, paymentMethodId};
        return queryOne(
                """
                SELECT
                  COUNT(*) AS total_transactions,
                  COALESCE(SUM(total_amount), 0) AS total_sales,
                  COALESCE(SUM(total_tax), 0) AS total_tax,
                  COALESCE(SUM(discount), 0) AS total_discount,
                  COALESCE(SUM(paid_amount), 0) AS total_collected,
                  COALESCE(SUM(total_amount) - SUM(total_tax), 0) AS net_sales,
                  CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*) ELSE 0 END AS average_sale
                FROM sales s
                WHERE date(sale_date) >= ? AND date(sale_date) <= ?
                  AND status NOT IN ('cancelled', 'draft')
                  %s
                """.formatted(paymentFilter),
                rs -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("total_transactions", rs.getInt("total_transactions"));
                    map.put("total_sales", rs.getBigDecimal("total_sales"));
                    map.put("total_tax", rs.getBigDecimal("total_tax"));
                    map.put("total_discount", rs.getBigDecimal("total_discount"));
                    map.put("total_collected", rs.getBigDecimal("total_collected"));
                    map.put("net_sales", rs.getBigDecimal("net_sales"));
                    map.put("average_sale", rs.getBigDecimal("average_sale"));
                    return map;
                },
                params
        ).orElse(Map.<String, Object>of());
    }

    @Override
    public List<Map<String, Object>> getDailyBreakdown(String startDate, String endDate, Long paymentMethodId) {
        return groupedBreakdown("date(sale_date)", "date", startDate, endDate, paymentMethodId);
    }

    @Override
    public List<Map<String, Object>> getMonthlyBreakdown(String startDate, String endDate, Long paymentMethodId) {
        return groupedBreakdown("strftime('%Y-%m', sale_date)", "month", startDate, endDate, paymentMethodId);
    }

    @Override
    public List<Map<String, Object>> getYearlyBreakdown(String startDate, String endDate, Long paymentMethodId) {
        return groupedBreakdown("strftime('%Y', sale_date)", "year", startDate, endDate, paymentMethodId);
    }

    @Override
    public List<Map<String, Object>> getTopSellingProducts(String startDate, String endDate, int limit, Long paymentMethodId) {
        String paymentFilter = paymentMethodId == null ? "" : "AND s.id IN (SELECT sale_id FROM transactions WHERE payment_method_id = ?)";
        Object[] params = paymentMethodId == null
                ? new Object[]{startDate, endDate, limit}
                : new Object[]{startDate, endDate, paymentMethodId, limit};
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
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("product_id", rs.getLong("product_id"));
                    map.put("product_name", rs.getString("product_name"));
                    map.put("variant_name", rs.getString("variant_name"));
                    map.put("sku", rs.getString("sku"));
                    map.put("total_quantity_sold", rs.getInt("total_quantity_sold"));
                    map.put("total_revenue", rs.getBigDecimal("total_revenue"));
                    return map;
                },
                params
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
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("payment_method", rs.getString("payment_method"));
                    map.put("total_transactions", rs.getInt("total_transactions"));
                    map.put("total_amount", rs.getBigDecimal("total_amount"));
                    return map;
                },
                startDate,
                endDate
        );
    }

    private List<Map<String, Object>> groupedBreakdown(String expression,
                                                       String alias,
                                                       String startDate,
                                                       String endDate,
                                                       Long paymentMethodId) {
        String paymentFilter = paymentMethodId == null ? "" : "AND s.id IN (SELECT sale_id FROM transactions WHERE payment_method_id = ?)";
        Object[] params = paymentMethodId == null ? new Object[]{startDate, endDate} : new Object[]{startDate, endDate, paymentMethodId};
        return queryList(
                """
                SELECT
                  %s AS %s,
                  COUNT(*) AS total_transactions,
                  COALESCE(SUM(total_amount), 0) AS total_sales,
                  COALESCE(SUM(total_tax), 0) AS total_tax,
                  COALESCE(SUM(discount), 0) AS total_discount
                FROM sales s
                WHERE date(sale_date) >= ? AND date(sale_date) <= ?
                  AND status NOT IN ('cancelled', 'draft')
                  %s
                GROUP BY %s
                ORDER BY %s ASC
                """.formatted(expression, alias, paymentFilter, expression, alias),
                rs -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put(alias, rs.getString(alias));
                    map.put("total_transactions", rs.getInt("total_transactions"));
                    map.put("total_sales", rs.getBigDecimal("total_sales"));
                    map.put("total_tax", rs.getBigDecimal("total_tax"));
                    map.put("total_discount", rs.getBigDecimal("total_discount"));
                    return map;
                },
                params
        );
    }
}
