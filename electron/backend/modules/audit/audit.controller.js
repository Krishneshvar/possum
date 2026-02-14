import * as AuditService from './audit.service.js';

export async function getAuditLogs(req, res) {
    try {
        const { userId, action, startDate, endDate, limit, offset } = req.query;

        const params = {
            userId: userId ? parseInt(userId, 10) : undefined,
            action: action || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0
        };

        const logs = await AuditService.getAuditLogs(params);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
