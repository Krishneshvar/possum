/**
 * Transaction Routes
 * Defines API routes for transaction operations
 */
import { Router } from 'express';
import { getTransactionsController } from './transactions.controller.js';

const router = Router();

router.get('/', getTransactionsController);

export default router;
