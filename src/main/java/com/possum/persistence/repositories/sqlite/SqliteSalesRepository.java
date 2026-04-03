package com.possum.persistence.repositories.sqlite;

import com.possum.domain.model.PaymentMethod;
import com.possum.domain.model.Sale;
import com.possum.domain.model.SaleItem;
import com.possum.domain.model.Transaction;
import com.possum.persistence.db.ConnectionProvider;
import com.possum.persistence.mappers.SaleItemMapper;
import com.possum.persistence.mappers.SaleMapper;
import com.possum.persistence.mappers.TransactionMapper;
import com.possum.persistence.repositories.interfaces.SalesRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.SaleFilter;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.StringJoiner;

public final class SqliteSalesRepository extends BaseSqliteRepository implements SalesRepository {

    private static final Set<String> SORTABLE = Set.of(
            "sale_date", "total_amount", "invoice_number", "paid_amount", "status", "fulfillment_status", "customer_name"
    );

    private final SaleMapper saleMapper = new SaleMapper();
    private final SaleItemMapper saleItemMapper = new SaleItemMapper();
    private final TransactionMapper transactionMapper = new TransactionMapper();

    public SqliteSalesRepository(ConnectionProvider connectionProvider) {
        super(connectionProvider);
    }

    @Override
    public long insertSale(Sale sale) {
        return executeInsert(
                """
                INSERT INTO sales (
                  invoice_number, total_amount, paid_amount, discount, total_tax, status, fulfillment_status, customer_id, user_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                sale.invoiceNumber(),
                sale.totalAmount(),
                sale.paidAmount(),
                sale.discount(),
                sale.totalTax(),
                sale.status(),
                sale.fulfillmentStatus() == null ? "pending" : sale.fulfillmentStatus(),
                sale.customerId(),
                sale.userId()
        );
    }

    @Override
    public long insertSaleItem(SaleItem item) {
        return executeInsert(
                """
                INSERT INTO sale_items (
                  sale_id, variant_id, quantity, price_per_unit, cost_per_unit, tax_rate, tax_amount, discount_amount,
                  applied_tax_rate, applied_tax_amount, tax_rule_snapshot
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                item.saleId(),
                item.variantId(),
                item.quantity(),
                item.pricePerUnit(),
                item.costPerUnit(),
                item.taxRate(),
                item.taxAmount(),
                item.discountAmount(),
                item.appliedTaxRate(),
                item.appliedTaxAmount(),
                item.taxRuleSnapshot()
        );
    }

    @Override
    public Optional<Sale> findSaleById(long id) {
        return queryOne(
                """
                SELECT
                  s.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, u.name AS biller_name,
                  t.payment_method_id,
                  pm.name AS payment_method_name
                FROM sales s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN transactions t ON t.sale_id = s.id AND t.type = 'payment'
                LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
                WHERE s.id = ?
                GROUP BY s.id
                """,
                saleMapper,
                id
        );
    }

    @Override
    public Optional<Sale> findSaleByInvoiceNumber(String invoiceNumber) {
        return queryOne(
                """
                SELECT
                  s.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, u.name AS biller_name,
                  t.payment_method_id,
                  pm.name AS payment_method_name
                FROM sales s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN transactions t ON t.sale_id = s.id AND t.type = 'payment'
                LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
                WHERE s.invoice_number = ?
                GROUP BY s.id
                """,
                saleMapper,
                invoiceNumber
        );
    }

    @Override
    public List<SaleItem> findSaleItems(long saleId) {
        return queryList(
                """
                SELECT
                  si.*, v.name AS variant_name, v.sku, p.name AS product_name,
                  (SELECT COALESCE(SUM(ri.quantity), 0) FROM return_items ri WHERE ri.sale_item_id = si.id) AS returned_quantity
                FROM sale_items si
                JOIN variants v ON si.variant_id = v.id
                JOIN products p ON v.product_id = p.id
                WHERE si.sale_id = ?
                """,
                saleItemMapper,
                saleId
        );
    }

    @Override
    public List<Transaction> findTransactionsBySaleId(long saleId) {
        return queryList(
                """
                SELECT t.*, pm.name AS payment_method_name
                FROM transactions t
                JOIN payment_methods pm ON t.payment_method_id = pm.id
                WHERE t.sale_id = ?
                ORDER BY t.transaction_date ASC
                """,
                transactionMapper,
                saleId
        );
    }

    @Override
    public PagedResult<Sale> findSales(SaleFilter filter) {
        List<Object> params = new ArrayList<>();
        String whereClause = buildWhere(filter, params);

        int total = queryOne(
                """
                SELECT COUNT(*) AS count
                FROM sales s
                LEFT JOIN customers c ON s.customer_id = c.id
                %s
                """.formatted(whereClause),
                rs -> rs.getInt("count"),
                params.toArray()
        ).orElse(0);

        String sortBy = SORTABLE.contains(filter.sortBy()) ? filter.sortBy() : "sale_date";
        String sortExpr = "customer_name".equals(sortBy) ? "c.name" : "s." + sortBy;
        String sortOrder = "ASC".equalsIgnoreCase(filter.sortOrder()) ? "ASC" : "DESC";

        int page = Math.max(1, filter.currentPage());
        int limit = Math.max(1, filter.itemsPerPage());
        int offset = (page - 1) * limit;

        params.add(limit);
        params.add(offset);

        List<Sale> sales = queryList(
                """
                SELECT
                  s.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, u.name AS biller_name,
                  (SELECT GROUP_CONCAT(DISTINCT pm.name) FROM transactions t JOIN payment_methods pm ON t.payment_method_id = pm.id WHERE t.sale_id = s.id AND t.status = 'completed') AS payment_method_name,
                  (SELECT t.payment_method_id FROM transactions t WHERE t.sale_id = s.id AND t.status = 'completed' LIMIT 1) AS payment_method_id
                FROM sales s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN users u ON s.user_id = u.id
                %s
                GROUP BY s.id
                ORDER BY %s %s
                LIMIT ? OFFSET ?
                """.formatted(whereClause, sortExpr, sortOrder),
                saleMapper,
                params.toArray()
        );

        int totalPages = (int) Math.ceil((double) total / limit);
        return new PagedResult<>(sales, total, totalPages, page, limit);
    }

    @Override
    public com.possum.application.sales.dto.SaleStats getSaleStats(SaleFilter filter) {
        List<Object> params = new ArrayList<>();
        String whereClause = buildWhere(filter, params);

        return queryOne(
                """
                SELECT
                    COUNT(*) AS total_bills,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
                    SUM(CASE WHEN status IN ('partially_paid', 'draft') THEN 1 ELSE 0 END) AS partial_count,
                    SUM(CASE WHEN status IN ('cancelled', 'refunded', 'partially_refunded') THEN 1 ELSE 0 END) AS cancelled_count
                FROM sales s
                LEFT JOIN customers c ON s.customer_id = c.id
                %s
                """.formatted(whereClause),
                rs -> new com.possum.application.sales.dto.SaleStats(
                        rs.getLong("total_bills"),
                        rs.getLong("paid_count"),
                        rs.getLong("partial_count"),
                        rs.getLong("cancelled_count")
                ),
                params.toArray()
        ).orElse(new com.possum.application.sales.dto.SaleStats(0, 0, 0, 0));
    }

    @Override
    public int updateSaleStatus(long id, String status) {
        return executeUpdate("UPDATE sales SET status = ? WHERE id = ?", status, id);
    }

    @Override
    public int updateFulfillmentStatus(long id, String status) {
        return executeUpdate("UPDATE sales SET fulfillment_status = ? WHERE id = ?", status, id);
    }

    @Override
    public int updateSalePaidAmount(long id, BigDecimal paidAmount) {
        return executeUpdate("UPDATE sales SET paid_amount = ? WHERE id = ?", paidAmount, id);
    }

    @Override
    public long insertTransaction(Transaction transaction, Long saleId) {
        return executeInsert(
                """
                INSERT INTO transactions (sale_id, amount, type, payment_method_id, status)
                VALUES (?, ?, ?, ?, ?)
                """,
                saleId,
                transaction.amount(),
                transaction.type(),
                transaction.paymentMethodId(),
                transaction.status() == null ? "completed" : transaction.status()
        );
    }

    @Override
    public Optional<String> getLastSaleInvoiceNumber() {
        return queryOne(
                "SELECT invoice_number FROM sales ORDER BY id DESC LIMIT 1",
                rs -> rs.getString("invoice_number")
        );
    }

    @Override
    public List<PaymentMethod> findPaymentMethods() {
        return queryList(
                "SELECT id, name, code, is_active FROM payment_methods WHERE is_active = 1",
                rs -> new PaymentMethod(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("code"),
                        rs.getInt("is_active") == 1
                )
        );
    }

    @Override
    public boolean paymentMethodExists(long id) {
        return queryOne("SELECT id FROM payment_methods WHERE id = ? AND is_active = 1", rs -> rs.getLong("id"), id).isPresent();
    }

    @Override
    public boolean saleExists(long id) {
        return queryOne("SELECT id FROM sales WHERE id = ?", rs -> rs.getLong("id"), id).isPresent();
    }

    @Override
    public Optional<String> getPaymentMethodCode(long paymentMethodId) {
        return queryOne(
                "SELECT code FROM payment_methods WHERE id = ?",
                rs -> rs.getString("code"),
                paymentMethodId
        );
    }

    @Override
    public long getNextSequenceForPaymentType(String paymentTypeCode) {
        // Atomic UPSERT: insert or increment the counter, then return the new value.
        // Uses a direct JDBC call because this must be a two-step operation within
        // the same connection/transaction context.
        Connection conn = connection();
        try {
            try (PreparedStatement upsert = conn.prepareStatement(
                    """
                    INSERT INTO invoice_sequences (payment_type_code, last_sequence)
                    VALUES (?, 1)
                    ON CONFLICT(payment_type_code) DO UPDATE SET last_sequence = last_sequence + 1
                    """)) {
                upsert.setString(1, paymentTypeCode);
                upsert.executeUpdate();
            }
            try (PreparedStatement select = conn.prepareStatement(
                    "SELECT last_sequence FROM invoice_sequences WHERE payment_type_code = ?")) {
                select.setString(1, paymentTypeCode);
                try (ResultSet rs = select.executeQuery()) {
                    if (rs.next()) {
                        return rs.getLong("last_sequence");
                    }
                }
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to get next sequence for payment type: " + paymentTypeCode, e);
        }
        throw new IllegalStateException("No sequence row found for payment type: " + paymentTypeCode);
    }

    private static String buildWhere(SaleFilter filter, List<Object> params) {
        StringJoiner joiner = new StringJoiner(" AND ");
        if (filter.status() != null && !filter.status().isEmpty()) {
            joiner.add("s.status IN (" + "?,".repeat(filter.status().size()).replaceAll(",$", "") + ")");
            params.addAll(filter.status());
        }
        if (filter.fulfillmentStatus() != null && !filter.fulfillmentStatus().isEmpty()) {
            joiner.add("s.fulfillment_status IN (" + "?,".repeat(filter.fulfillmentStatus().size()).replaceAll(",$", "") + ")");
            params.addAll(filter.fulfillmentStatus());
        }
        if (filter.customerId() != null) {
            joiner.add("s.customer_id = ?");
            params.add(filter.customerId());
        }
        if (filter.userId() != null) {
            joiner.add("s.user_id = ?");
            params.add(filter.userId());
        }
        if (filter.startDate() != null && !filter.startDate().isBlank()) {
            String date = filter.startDate().substring(0, Math.min(10, filter.startDate().length()));
            joiner.add("s.sale_date >= ?");
            params.add(date + " 00:00:00");
        }
        if (filter.endDate() != null && !filter.endDate().isBlank()) {
            String date = filter.endDate().substring(0, Math.min(10, filter.endDate().length()));
            joiner.add("s.sale_date <= ?");
            params.add(date + " 23:59:59");
        }
        if (filter.searchTerm() != null && !filter.searchTerm().isBlank()) {
            String fuzzy = "%" + filter.searchTerm() + "%";
            joiner.add("(s.invoice_number LIKE ? OR c.name LIKE ?)");
            params.add(fuzzy);
            params.add(fuzzy);
        }
        if (filter.minAmount() != null) {
            joiner.add("s.total_amount >= ?");
            params.add(filter.minAmount());
        }
        if (filter.maxAmount() != null) {
            joiner.add("s.total_amount <= ?");
            params.add(filter.maxAmount());
        }
        if (filter.paymentMethodIds() != null && !filter.paymentMethodIds().isEmpty()) {
            joiner.add("EXISTS (SELECT 1 FROM transactions tx WHERE tx.sale_id = s.id AND tx.payment_method_id IN (" 
                    + "?,".repeat(filter.paymentMethodIds().size()).replaceAll(",$", "") + "))");
            params.addAll(filter.paymentMethodIds());
        }
        if (joiner.length() == 0) {
            return "";
        }
        return "WHERE " + joiner;
    }

    @Override
    public int updateTransactionPaymentMethod(long saleId, long newPaymentMethodId) {
        return executeUpdate(
                "UPDATE transactions SET payment_method_id = ? WHERE sale_id = ? AND type = 'payment'",
                newPaymentMethodId,
                saleId
        );
    }

    @Override
    public int updateSaleCustomer(long saleId, Long customerId) {
        return executeUpdate("UPDATE sales SET customer_id = ? WHERE id = ?", customerId, saleId);
    }

}


