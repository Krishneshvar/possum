/**
 * Audit Repository
 * Handles all database operations for audit logging
 */
import { getDB } from '../../shared/db/index.js';

export interface AuditLogFilters {
    tableName?: string;
    rowId?: number;
    userId?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    currentPage?: number;
    itemsPerPage?: number;
}

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
    new_data,
    event_details
}: {
    user_id: number;
    action: string;
    table_name: string | null;
    row_id: number | null;
    old_data: any | null;
    new_data: any | null;
    event_details: any | null;
}) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO audit_log (user_id, action, table_name, row_id, old_data, new_data, event_details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
        user_id,
        action,
        table_name || null,
        row_id || null,
        old_data ? JSON.stringify(old_data) : null,
        new_data ? JSON.stringify(new_data) : null,
        event_details ? JSON.stringify(event_details) : null
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
    searchTerm,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    currentPage = 1,
    itemsPerPage = 50
}: AuditLogFilters) {
    const db = getDB();
    const filterClauses: string[] = [];
    const filterParams: any[] = [];

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

    if (searchTerm) {
        filterClauses.push('(al.action LIKE ? OR al.table_name LIKE ? OR u.name LIKE ?)');
        const likeParam = `%${searchTerm}%`;
        filterParams.push(likeParam, likeParam, likeParam);
    }

    const whereClause = filterClauses.length > 0
        ? `WHERE ${filterClauses.join(' AND ')}`
        : '';

    const countResult = db.prepare(`
        SELECT COUNT(*) as total_count FROM audit_log al 
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
    `).get(...filterParams) as { total_count: number };

    const totalCount = countResult?.total_count ?? 0;

    const offset = (currentPage! - 1) * itemsPerPage!;

    // Validate sortBy to prevent SQL injection
    const allowedSortColumns = ['created_at', 'action', 'table_name', 'user_name'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder!.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const logs = db.prepare(`
        SELECT 
            al.*,
            u.name as user_name
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY ${validSortBy === 'user_name' ? 'u.name' : `al.${validSortBy}`} ${validSortOrder}
        LIMIT ? OFFSET ?
    `).all(...filterParams, itemsPerPage, offset);

    return {
        logs,
        totalCount,
        totalPages: Math.ceil(totalCount / itemsPerPage!),
        currentPage
    };
}
