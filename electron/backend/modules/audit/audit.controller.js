/**
 * Audit Controller
 * Handles HTTP requests for audit logs
 */
import * as auditService from './audit.service.js';

/**
 * GET /api/audit
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(req, res) {
    try {
        const {
            tableName,
            rowId,
            userId,
            action,
            startDate,
            endDate,
            searchTerm,
            sortBy,
            sortOrder,
            page = 1,
            limit = 50
        } = req.query;

        const logs = auditService.getAuditLogs({
            tableName: tableName || null,
            rowId: rowId ? parseInt(rowId, 10) : null,
            userId: userId ? parseInt(userId, 10) : null,
            action: action || null,
            startDate: startDate || null,
            endDate: endDate || null,
            searchTerm: searchTerm || null,
            sortBy: sortBy || 'created_at',
            sortOrder: sortOrder || 'DESC',
            currentPage: parseInt(page, 10),
            itemsPerPage: parseInt(limit, 10)
        });

        res.json(logs);
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ error: 'Failed to retrieve audit logs.' });
    }
}
