package com.possum.persistence.repositories.sqlite;

import com.possum.domain.model.PaymentPolicy;
import com.possum.domain.model.Supplier;
import com.possum.persistence.db.ConnectionProvider;
import com.possum.persistence.repositories.interfaces.SupplierRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.SupplierFilter;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.StringJoiner;

public final class SqliteSupplierRepository extends BaseSqliteRepository implements SupplierRepository {

    public SqliteSupplierRepository(ConnectionProvider connectionProvider) {
        super(connectionProvider);
    }

    @Override
    public PagedResult<Supplier> getAllSuppliers(SupplierFilter filter) {
        List<Object> params = new ArrayList<>();
        String where = buildWhere(filter, params);

        int total = queryOne(
                "SELECT COUNT(*) AS count FROM suppliers s " + where,
                rs -> rs.getInt("count"),
                params.toArray()
        ).orElse(0);

        String sortBy = switch (filter.sortBy() == null ? "name" : filter.sortBy()) {
            case "contact_person" -> "s.contact_person";
            case "phone" -> "s.phone";
            case "email" -> "s.email";
            case "created_at" -> "s.created_at";
            default -> "s.name";
        };
        String sortOrder = "DESC".equalsIgnoreCase(filter.sortOrder()) ? "DESC" : "ASC";
        int page = Math.max(1, filter.page());
        int limit = Math.max(1, filter.limit());
        int offset = (page - 1) * limit;

        params.add(limit);
        params.add(offset);

        List<Supplier> suppliers = queryList(
                """
                SELECT
                  s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.gstin,
                  s.payment_policy_id, s.created_at, s.updated_at, s.deleted_at,
                  pp.name AS payment_policy_name
                FROM suppliers s
                LEFT JOIN payment_policies pp ON s.payment_policy_id = pp.id
                %s
                ORDER BY %s %s
                LIMIT ? OFFSET ?
                """.formatted(where, sortBy, sortOrder),
                this::mapSupplier,
                params.toArray()
        );

        int totalPages = (int) Math.ceil((double) total / limit);
        return new PagedResult<>(suppliers, total, totalPages, page, limit);
    }

    @Override
    public Optional<Supplier> findSupplierById(long id) {
        return queryOne(
                """
                SELECT
                  s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.gstin,
                  s.payment_policy_id, s.created_at, s.updated_at, s.deleted_at,
                  pp.name AS payment_policy_name
                FROM suppliers s
                LEFT JOIN payment_policies pp ON s.payment_policy_id = pp.id
                WHERE s.id = ? AND s.deleted_at IS NULL
                """,
                this::mapSupplier,
                id
        );
    }

    @Override
    public long createSupplier(Supplier supplier) {
        return executeInsert(
                """
                INSERT INTO suppliers (name, contact_person, phone, email, address, gstin, payment_policy_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                supplier.name(),
                supplier.contactPerson(),
                supplier.phone(),
                supplier.email(),
                supplier.address(),
                supplier.gstin(),
                supplier.paymentPolicyId() == null ? 1L : supplier.paymentPolicyId()
        );
    }

    @Override
    public int updateSupplier(long id, Supplier supplier) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("UPDATE suppliers SET updated_at = CURRENT_TIMESTAMP");
        if (supplier.name() != null) {
            sql.append(", name = ?");
            params.add(supplier.name());
        }
        if (supplier.contactPerson() != null) {
            sql.append(", contact_person = ?");
            params.add(supplier.contactPerson());
        }
        if (supplier.phone() != null) {
            sql.append(", phone = ?");
            params.add(supplier.phone());
        }
        if (supplier.email() != null) {
            sql.append(", email = ?");
            params.add(supplier.email());
        }
        if (supplier.address() != null) {
            sql.append(", address = ?");
            params.add(supplier.address());
        }
        if (supplier.gstin() != null) {
            sql.append(", gstin = ?");
            params.add(supplier.gstin());
        }
        if (supplier.paymentPolicyId() != null) {
            sql.append(", payment_policy_id = ?");
            params.add(supplier.paymentPolicyId());
        }
        params.add(id);
        sql.append(" WHERE id = ? AND deleted_at IS NULL");
        return executeUpdate(sql.toString(), params.toArray());
    }

    @Override
    public int deleteSupplier(long id) {
        return executeUpdate(
                "UPDATE suppliers SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
                id
        );
    }

    @Override
    public List<PaymentPolicy> getPaymentPolicies() {
        return queryList(
                """
                SELECT id, name, days_to_pay, description, created_at, updated_at, deleted_at
                FROM payment_policies
                WHERE deleted_at IS NULL
                ORDER BY name ASC
                """,
                this::mapPaymentPolicy
        );
    }

    @Override
    public long createPaymentPolicy(String name, int daysToPay, String description) {
        return executeInsert(
                "INSERT INTO payment_policies (name, days_to_pay, description) VALUES (?, ?, ?)",
                name,
                daysToPay,
                description
        );
    }

    private static String buildWhere(SupplierFilter filter, List<Object> params) {
        StringJoiner joiner = new StringJoiner(" AND ");
        joiner.add("s.deleted_at IS NULL");
        if (filter.searchTerm() != null && !filter.searchTerm().isBlank()) {
            String fuzzy = "%" + filter.searchTerm() + "%";
            joiner.add("(s.name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.address LIKE ? OR s.gstin LIKE ?)");
            params.add(fuzzy);
            params.add(fuzzy);
            params.add(fuzzy);
            params.add(fuzzy);
            params.add(fuzzy);
            params.add(fuzzy);
        }
        if (filter.paymentPolicyIds() != null && !filter.paymentPolicyIds().isEmpty()) {
            joiner.add("s.payment_policy_id IN (" + "?,".repeat(filter.paymentPolicyIds().size()).replaceAll(",$", "") + ")");
            params.addAll(filter.paymentPolicyIds());
        }
        return "WHERE " + joiner;
    }

    private Supplier mapSupplier(ResultSet rs) throws SQLException {
        return new Supplier(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("contact_person"),
                rs.getString("phone"),
                rs.getString("email"),
                rs.getString("address"),
                rs.getString("gstin"),
                rs.getLong("payment_policy_id"),
                rs.getString("payment_policy_name"),
                toLocalDateTime(rs.getString("created_at")),
                toLocalDateTime(rs.getString("updated_at")),
                toLocalDateTime(rs.getString("deleted_at"))
        );
    }

    private PaymentPolicy mapPaymentPolicy(ResultSet rs) throws SQLException {
        return new PaymentPolicy(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getInt("days_to_pay"),
                rs.getString("description"),
                toLocalDateTime(rs.getString("created_at")),
                toLocalDateTime(rs.getString("updated_at")),
                toLocalDateTime(rs.getString("deleted_at"))
        );
    }

    private static LocalDateTime toLocalDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDateTime.parse(value.replace(' ', 'T'));
    }
}
