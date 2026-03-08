package com.possum.persistence.repositories.sqlite;

import com.possum.domain.model.AuditLog;
import com.possum.persistence.db.ConnectionProvider;
import com.possum.persistence.mappers.AuditLogMapper;
import com.possum.persistence.repositories.interfaces.AuditRepository;
import com.possum.shared.dto.AuditLogFilter;
import com.possum.shared.dto.PagedResult;

import java.util.ArrayList;
import java.util.List;
import java.util.StringJoiner;

public final class SqliteAuditRepository extends BaseSqliteRepository implements AuditRepository {

    private final AuditLogMapper auditLogMapper = new AuditLogMapper();

    public SqliteAuditRepository(ConnectionProvider connectionProvider) {
        super(connectionProvider);
    }

    @Override
    public long insertAuditLog(AuditLog auditLog) {
        return executeInsert(
                """
                INSERT INTO audit_log (user_id, action, table_name, row_id, old_data, new_data, event_details)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                auditLog.userId(),
                auditLog.action(),
                auditLog.tableName(),
                auditLog.rowId(),
                auditLog.oldData(),
                auditLog.newData(),
                auditLog.eventDetails()
        );
    }

    @Override
    public AuditLog findAuditLogById(Long id) {
        return queryOne(
                """
                SELECT al.*, u.name AS user_name
                FROM audit_log al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.id = ?
                """,
                auditLogMapper,
                id
        ).orElse(null);
    }

    @Override
    public PagedResult<AuditLog> findAuditLogs(AuditLogFilter filter) {
        List<Object> params = new ArrayList<>();
        String whereClause = buildWhere(filter, params);

        int totalCount = queryOne(
                "SELECT COUNT(*) AS count FROM audit_log al LEFT JOIN users u ON al.user_id = u.id " + whereClause,
                rs -> rs.getInt("count"),
                params.toArray()
        ).orElse(0);

        String sortBy = filter.sortBy() == null ? "created_at" : filter.sortBy();
        String sortOrder = "ASC".equalsIgnoreCase(filter.sortOrder()) ? "ASC" : "DESC";
        String sortExpression = "user_name".equals(sortBy) ? "u.name" : "al." + sortBy;

        int page = Math.max(1, filter.currentPage());
        int limit = Math.max(1, filter.itemsPerPage());
        int offset = (page - 1) * limit;

        params.add(limit);
        params.add(offset);

        List<AuditLog> logs = queryList(
                """
                SELECT al.*, u.name AS user_name
                FROM audit_log al
                LEFT JOIN users u ON al.user_id = u.id
                %s
                ORDER BY %s %s
                LIMIT ? OFFSET ?
                """.formatted(whereClause, sortExpression, sortOrder),
                auditLogMapper,
                params.toArray()
        );

        int totalPages = (int) Math.ceil((double) totalCount / limit);
        return new PagedResult<>(logs, totalCount, totalPages, page, limit);
    }

    private static String buildWhere(AuditLogFilter filter, List<Object> params) {
        StringJoiner joiner = new StringJoiner(" AND ");
        if (filter.tableName() != null && !filter.tableName().isBlank()) {
            joiner.add("al.table_name = ?");
            params.add(filter.tableName());
        }
        if (filter.rowId() != null) {
            joiner.add("al.row_id = ?");
            params.add(filter.rowId());
        }
        if (filter.userId() != null) {
            joiner.add("al.user_id = ?");
            params.add(filter.userId());
        }
        if (filter.action() != null && !filter.action().isBlank()) {
            joiner.add("al.action = ?");
            params.add(filter.action());
        }
        if (filter.startDate() != null && !filter.startDate().isBlank()) {
            joiner.add("al.created_at >= ?");
            params.add(filter.startDate());
        }
        if (filter.endDate() != null && !filter.endDate().isBlank()) {
            joiner.add("al.created_at <= ?");
            params.add(filter.endDate());
        }
        if (filter.searchTerm() != null && !filter.searchTerm().isBlank()) {
            joiner.add("(al.action LIKE ? OR al.table_name LIKE ? OR u.name LIKE ?)");
            String fuzzy = "%" + filter.searchTerm() + "%";
            params.add(fuzzy);
            params.add(fuzzy);
            params.add(fuzzy);
        }
        if (joiner.length() == 0) {
            return "";
        }
        return "WHERE " + joiner;
    }
}
