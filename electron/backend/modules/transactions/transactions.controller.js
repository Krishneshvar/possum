/**
 * Transaction Controller
 * Handles HTTP requests for transactions
 */
import * as transactionService from './transactions.service.js';

/**
 * Get transactions list
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export function getTransactionsController(req, res) {
    try {
        const result = transactionService.getTransactions(req.query);
        res.json(result);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
}
