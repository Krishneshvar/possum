package com.possum.persistence.repositories.sqlite;

import com.possum.domain.model.Customer;
import com.possum.persistence.db.ConnectionProvider;
import com.possum.persistence.mappers.CustomerMapper;
import com.possum.persistence.repositories.interfaces.CustomerRepository;
import com.possum.shared.dto.CustomerFilter;
import com.possum.shared.dto.PagedResult;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public final class SqliteCustomerRepository extends BaseSqliteRepository implements CustomerRepository {

    private final CustomerMapper mapper = new CustomerMapper();

    public SqliteCustomerRepository(ConnectionProvider connectionProvider) {
        super(connectionProvider);
    }

    @Override
    public PagedResult<Customer> findCustomers(CustomerFilter filter) {
        List<Object> params = new ArrayList<>();
        String whereClause = buildWhereClause(filter.searchTerm(), params);

        int safePageInput = filter.page() != null ? filter.page() : filter.currentPage();
        int safeLimitInput = filter.limit() != null ? filter.limit() : filter.itemsPerPage();
        int safePage = Math.max(1, safePageInput);
        int safeLimit = Math.max(1, Math.min(1000, safeLimitInput));
        int offset = (safePage - 1) * safeLimit;

        int totalCount = queryOne(
                """
                SELECT COUNT(id) AS total
                FROM customers
                %s
                """.formatted(whereClause),
                rs -> rs.getInt("total"),
                params.toArray()
        ).orElse(0);

        String sortField = switch (filter.sortBy() == null ? "name" : filter.sortBy()) {
            case "email" -> "email";
            case "created_at" -> "created_at";
            default -> "name";
        };
        String sortOrder = "DESC".equalsIgnoreCase(filter.sortOrder()) ? "DESC" : "ASC";

        params.add(safeLimit);
        params.add(offset);
        List<Customer> rows = queryList(
                """
                SELECT
                  id, name, phone, email, address, created_at, updated_at, deleted_at
                FROM customers
                %s
                ORDER BY %s %s
                LIMIT ? OFFSET ?
                """.formatted(whereClause, sortField, sortOrder),
                mapper,
                params.toArray()
        );

        int totalPages = totalCount > 0 ? (int) Math.ceil((double) totalCount / safeLimit) : 1;
        return new PagedResult<>(rows, totalCount, totalPages, safePage, safeLimit);
    }

    @Override
    public Optional<Customer> findCustomerById(long id) {
        return queryOne(
                """
                SELECT id, name, phone, email, address, created_at, updated_at, deleted_at
                FROM customers
                WHERE id = ? AND deleted_at IS NULL
                """,
                mapper,
                id
        );
    }

    @Override
    public Optional<Customer> insertCustomer(String name, String phone, String email, String address) {
        long id = executeInsert(
                """
                INSERT INTO customers (name, phone, email, address)
                VALUES (?, ?, ?, ?)
                """,
                name,
                phone,
                email,
                address
        );
        return findCustomerById(id);
    }

    @Override
    public Optional<Customer> updateCustomerById(long id, String name, String phone, String email, String address) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("UPDATE customers SET updated_at = CURRENT_TIMESTAMP");

        if (name != null) {
            sql.append(", name = ?");
            params.add(name);
        }
        if (phone != null) {
            sql.append(", phone = ?");
            params.add(phone);
        }
        if (email != null) {
            sql.append(", email = ?");
            params.add(email);
        }
        if (address != null) {
            sql.append(", address = ?");
            params.add(address);
        }

        if (!params.isEmpty()) {
            params.add(id);
            sql.append(" WHERE id = ? AND deleted_at IS NULL");
            executeUpdate(sql.toString(), params.toArray());
        }

        return findCustomerById(id);
    }

    @Override
    public boolean softDeleteCustomer(long id) {
        return executeUpdate(
                "UPDATE customers SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
                id
        ) > 0;
    }

    private static String buildWhereClause(String searchTerm, List<Object> params) {
        String trimmed = searchTerm == null ? null : searchTerm.trim();
        StringBuilder where = new StringBuilder("WHERE deleted_at IS NULL");
        if (trimmed == null || trimmed.isBlank()) {
            return where.toString();
        }

        if (trimmed.matches("^\\d+$")) {
            where.append(" AND (name LIKE ? OR id = ? OR phone LIKE ?)");
            params.add("%" + trimmed + "%");
            params.add(Integer.parseInt(trimmed));
            params.add("%" + trimmed + "%");
        } else {
            where.append(" AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)");
            params.add("%" + trimmed + "%");
            params.add("%" + trimmed + "%");
            params.add("%" + trimmed + "%");
        }
        return where.toString();
    }
}
