/**
 * Transaction Controller
 * Handles HTTP requests for transactions
 */
import * as transactionService from './transactions.service.js';
import { Request, Response } from 'express';
import { logger } from '../../shared/utils/logger.js';
import { GetTransactionsQuery } from './transactions.schema.js';

/**
 * Get transactions list
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export function getTransactionsController(req: Request, res: Response) {
    try {
        const query = req.query as unknown as GetTransactionsQuery;
        const result = transactionService.getTransactions(query, { permissions: req.permissions });
        res.json(result);
    } catch (error: any) {
        const message = error?.message || 'Failed to fetch transactions';
        const statusCode = String(message).startsWith('Forbidden:') ? 403 : 500;
        logger.error('Transactions list fetch failed', {
            user_id: req.user?.id ?? null,
            query: req.query,
            error: message
        });
        res.status(statusCode).json({ error: message, code: statusCode === 403 ? 'FORBIDDEN' : 'TRANSACTIONS_FETCH_FAILED' });
    }
}
