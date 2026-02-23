import { Router } from 'express';
import { getTransactionsController } from './transactions.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { getTransactionsSchema } from './transactions.schema.js';

const router = Router();

router.get('/', requirePermission(['transactions.view', 'sales.view', 'sales.create']), validate(getTransactionsSchema), getTransactionsController);

export default router;
