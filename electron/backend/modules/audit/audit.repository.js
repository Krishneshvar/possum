/**
 * Audit Repository
 * Handles all database operations for audit logging
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Insert an audit log entry
 * @param {Object} logData - Audit log data
 * @returns {Object} Insert result
 */
export function insertAuditLog({
    user_id,
    action,
    table_name,
    row_id,
    old_data,
    new_data
}) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO audit_log (user_id, action, table_name, row_id, old_data, new_data)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
        user_id,
        action,
        table_name,
        row_id,
        old_data ? JSON.stringify(old_data) : null,
        new_data ? JSON.stringify(new_data) : null
    );
}

/**
 * Find audit logs with filtering
 * @param {Object} params - Filter params
 * @returns {Object} Audit logs with pagination
 */
export function findAuditLogs({
    tableName,
    rowId,
    userId,
    action,
    startDate,
    endDate,
    currentPage = 1,
    itemsPerPage = 50
}) {
    const db = getDB();
    const filterClauses = [];
    const filterParams = [];

    if (tableName) {
        filterClauses.push('al.table_name = ?');
        filterParams.push(tableName);
    }

    if (rowId) {
        filterClauses.push('al.row_id = ?');
        filterParams.push(rowId);
    }

    if (userId) {
        filterClauses.push('al.user_id = ?');
        filterParams.push(userId);
    }

    if (action) {
        filterClauses.push('al.action = ?');
        filterParams.push(action);
    }

    if (startDate) {
        filterClauses.push('al.created_at >= ?');
        filterParams.push(startDate);
    }

    if (endDate) {
        filterClauses.push('al.created_at <= ?');
        filterParams.push(endDate);
    }

    const whereClause = filterClauses.length > 0
        ? `WHERE ${filterClauses.join(' AND ')}`
        : '';

    const countResult = db.prepare(`
        SELECT COUNT(*) as total_count FROM audit_log al ${whereClause}
    `).get(...filterParams);

    const totalCount = countResult?.total_count ?? 0;

    const offset = (currentPage - 1) * itemsPerPage;
    const logs = db.prepare(`
        SELECT 
            al.*,
            u.name as user_name
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...filterParams, itemsPerPage, offset);

    return {
        logs,
        totalCount,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        currentPage
    };
}
