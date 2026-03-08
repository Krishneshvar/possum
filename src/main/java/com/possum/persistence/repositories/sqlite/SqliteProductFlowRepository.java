package com.possum.persistence.repositories.sqlite;

import com.possum.domain.model.ProductFlow;
import com.possum.persistence.db.ConnectionProvider;
import com.possum.persistence.repositories.interfaces.ProductFlowRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

public final class SqliteProductFlowRepository extends BaseSqliteRepository implements ProductFlowRepository {

    public SqliteProductFlowRepository(ConnectionProvider connectionProvider) {
        super(connectionProvider);
    }

    @Override
    public long insertProductFlow(ProductFlow flow) {
        return executeInsert(
                "INSERT INTO product_flow (variant_id, event_type, quantity, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)",
                flow.variantId(),
                flow.eventType(),
                flow.quantity(),
                flow.referenceType(),
                flow.referenceId()
        );
    }

    @Override
    public List<ProductFlow> findFlowByVariantId(long variantId, int limit, int offset, String startDate, String endDate, List<String> paymentMethods) {
        List<Object> params = new ArrayList<>();
        params.add(variantId);

        StringBuilder sql = new StringBuilder("""
                SELECT
                  pf.*, v.name AS variant_name, p.name AS product_name, GROUP_CONCAT(DISTINCT pm.name) AS payment_method_names
                FROM product_flow pf
                JOIN variants v ON pf.variant_id = v.id
                JOIN products p ON v.product_id = p.id
                LEFT JOIN sale_items si ON (pf.reference_type = 'sale_item' AND pf.reference_id = si.id)
                LEFT JOIN sales s ON si.sale_id = s.id
                LEFT JOIN transactions t ON (s.id = t.sale_id AND t.type = 'payment' AND t.status = 'completed')
                LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
                WHERE pf.variant_id = ?
                """);

        if (startDate != null && !startDate.isBlank()) {
            sql.append(" AND pf.event_date >= ?");
            params.add(startDate);
        }
        if (endDate != null && !endDate.isBlank()) {
            sql.append(" AND pf.event_date <= ?");
            params.add(endDate);
        }
        if (paymentMethods != null && !paymentMethods.isEmpty()) {
            String placeholders = "?,".repeat(paymentMethods.size()).replaceAll(",$", "");
            sql.append(" AND pm.name IN (").append(placeholders).append(")");
            params.addAll(paymentMethods);
        }

        sql.append(" GROUP BY pf.id ORDER BY pf.event_date DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        return queryList(
                sql.toString(),
                rs -> new ProductFlow(
                        rs.getLong("id"),
                        rs.getLong("variant_id"),
                        rs.getString("event_type"),
                        rs.getInt("quantity"),
                        rs.getString("reference_type"),
                        rs.getLong("reference_id"),
                        rs.getString("variant_name"),
                        rs.getString("product_name"),
                        rs.getString("payment_method_names"),
                        com.possum.shared.util.SqlMapperUtils.getLocalDateTime(rs, "event_date")
                ),
                params.toArray()
        );
    }

    @Override
    public Map<String, Object> getFlowSummary(long variantId) {
        return queryOne(
                """
                SELECT
                  SUM(CASE WHEN event_type = 'purchase' THEN quantity ELSE 0 END) AS total_purchased,
                  SUM(CASE WHEN event_type = 'sale' THEN ABS(quantity) ELSE 0 END) AS total_sold,
                  SUM(CASE WHEN event_type = 'return' THEN quantity ELSE 0 END) AS total_returned,
                  SUM(CASE WHEN event_type = 'adjustment' AND quantity < 0 THEN ABS(quantity) ELSE 0 END) AS total_lost,
                  SUM(CASE WHEN event_type = 'adjustment' AND quantity > 0 THEN quantity ELSE 0 END) AS total_gained,
                  COUNT(*) AS total_events
                FROM product_flow
                WHERE variant_id = ?
                """,
                rs -> {
                    int purchased = rs.getInt("total_purchased");
                    int sold = rs.getInt("total_sold");
                    int returned = rs.getInt("total_returned");
                    int lost = rs.getInt("total_lost");
                    int gained = rs.getInt("total_gained");
                    int events = rs.getInt("total_events");
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("totalPurchased", purchased);
                    map.put("totalSold", sold);
                    map.put("totalReturned", returned);
                    map.put("totalLost", lost);
                    map.put("totalGained", gained);
                    map.put("totalEvents", events);
                    map.put("netMovement", purchased + returned + gained - sold - lost);
                    return map;
                },
                variantId
        ).orElse(Map.<String, Object>of());
    }

    @Override
    public List<ProductFlow> findFlowByReference(String referenceType, long referenceId) {
        return queryList(
                """
                SELECT pf.*, NULL AS variant_name, NULL AS product_name, NULL AS payment_method_names
                FROM product_flow pf
                WHERE reference_type = ? AND reference_id = ?
                ORDER BY event_date DESC
                """,
                rs -> new ProductFlow(
                        rs.getLong("id"),
                        rs.getLong("variant_id"),
                        rs.getString("event_type"),
                        rs.getInt("quantity"),
                        rs.getString("reference_type"),
                        rs.getLong("reference_id"),
                        rs.getString("variant_name"),
                        rs.getString("product_name"),
                        rs.getString("payment_method_names"),
                        com.possum.shared.util.SqlMapperUtils.getLocalDateTime(rs, "event_date")
                ),
                referenceType,
                referenceId
        );
    }
}
