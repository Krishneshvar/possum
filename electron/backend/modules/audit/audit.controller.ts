import * as AuditService from './audit.service.js';
import { Request, Response } from 'express';
import { AuditLogFilters } from './audit.repository.js';

export async function getAuditLogs(req: Request, res: Response) {
    try {
        const { userId, action, startDate, endDate, limit, offset, sortBy, sortOrder, page, searchTerm } = req.query;

        const limitNum = limit ? parseInt(limit as string, 10) : 100;
        const pageNum = page ? parseInt(page as string, 10) : 1;

        const params: AuditLogFilters = {
            userId: userId ? parseInt(userId as string, 10) : undefined,
            action: action as string || undefined,
            startDate: startDate as string || undefined,
            endDate: endDate as string || undefined,
            searchTerm: searchTerm as string || undefined,
            sortBy: sortBy as string || undefined,
            sortOrder: (sortOrder as 'ASC' | 'DESC') || undefined,
            itemsPerPage: limitNum,
            currentPage: pageNum
        };

        const logs = await AuditService.getAuditLogs(params);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
