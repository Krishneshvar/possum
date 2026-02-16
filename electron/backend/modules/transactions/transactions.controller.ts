/**
 * Transaction Controller
 * Handles HTTP requests for transactions
 */
import * as transactionService from './transactions.service.js';
import { Request, Response } from 'express';

/**
 * Get transactions list
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export function getTransactionsController(req: Request, res: Response) {
    try {
        const result = transactionService.getTransactions(req.query as any);
        res.json(result);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
}
