/**
 * Audit Service
 * Contains business logic for audit operations
 */
import * as auditRepository from './audit.repository.js';
import { AuditLogFilters } from './audit.repository.js';

/**
 * Log an action to the audit trail
 * @param {number} userId - User who performed the action
 * @param {string} action - Action type (create, update, delete, login, logout)
 * @param {string} tableName - Affected table (optional for login/logout)
 * @param {number} rowId - Affected row ID (optional for login/logout)
 * @param {Object} oldData - Previous data (for updates/deletes)
 * @param {Object} newData - New data (for creates/updates)
 * @param {Object} eventDetails - Additional event context
 * @returns {Object} Insert result
 */
export function logAction(
    userId: number,
    action: string,
    tableName: string | null = null,
    rowId: number | null = null,
    oldData: any | null = null,
    newData: any | null = null,
    eventDetails: any | null = null
) {
    return auditRepository.insertAuditLog({
        user_id: userId,
        action,
        table_name: tableName,
        row_id: rowId,
        old_data: oldData,
        new_data: newData,
        event_details: eventDetails
    });
}

/**
 * Log a login event
 * @param {number} userId - User who logged in
 * @param {Object} details - Login details (IP, user agent, etc.)
 */
export function logLogin(userId: number, details: any = {}) {
    return logAction(userId, 'login', null, null, null, null, details);
}

/**
 * Log a logout event
 * @param {number} userId - User who logged out
 * @param {Object} details - Logout details
 */
export function logLogout(userId: number, details: any = {}) {
    return logAction(userId, 'logout', null, null, null, null, details);
}

/**
 * Log a create operation
 * @param {number} userId - User who created the record
 * @param {string} tableName - Table name
 * @param {number} rowId - Created row ID
 * @param {Object} newData - Created data
 */
export function logCreate(userId: number, tableName: string, rowId: number, newData: any) {
    return logAction(userId, 'create', tableName, rowId, null, newData);
}

/**
 * Log an update operation
 * @param {number} userId - User who updated the record
 * @param {string} tableName - Table name
 * @param {number} rowId - Updated row ID
 * @param {Object} oldData - Previous data
 * @param {Object} newData - Updated data
 */
export function logUpdate(userId: number, tableName: string, rowId: number, oldData: any, newData: any) {
    return logAction(userId, 'update', tableName, rowId, oldData, newData);
}

/**
 * Log a delete operation
 * @param {number} userId - User who deleted the record
 * @param {string} tableName - Table name
 * @param {number} rowId - Deleted row ID
 * @param {Object} oldData - Deleted data
 */
export function logDelete(userId: number, tableName: string, rowId: number, oldData: any) {
    return logAction(userId, 'delete', tableName, rowId, oldData, null);
}

/**
 * Get audit logs
 * @param {Object} params - Filter params
 * @returns {Object} Audit logs with pagination
 */
export function getAuditLogs(params: AuditLogFilters) {
    return auditRepository.findAuditLogs(params);
}
