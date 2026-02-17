import { Router } from 'express';
import { getTransactionsController } from './transactions.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/', requirePermission(['reports.view', 'sales.create']), getTransactionsController);

export default router;
