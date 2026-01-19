/**
 * Audit Service
 * Contains business logic for audit operations
 */
import * as auditRepository from './audit.repository.js';

/**
 * Log an action to the audit trail
 * @param {number} userId - User who performed the action
 * @param {string} action - Action type (create, update, delete)
 * @param {string} tableName - Affected table
 * @param {number} rowId - Affected row ID
 * @param {Object} oldData - Previous data (for updates/deletes)
 * @param {Object} newData - New data (for creates/updates)
 * @returns {Object} Insert result
 */
export function logAction(userId, action, tableName, rowId, oldData = null, newData = null) {
    return auditRepository.insertAuditLog({
        user_id: userId,
        action,
        table_name: tableName,
        row_id: rowId,
        old_data: oldData,
        new_data: newData
    });
}

/**
 * Get audit logs
 * @param {Object} params - Filter params
 * @returns {Object} Audit logs with pagination
 */
export function getAuditLogs(params) {
    return auditRepository.findAuditLogs(params);
}
