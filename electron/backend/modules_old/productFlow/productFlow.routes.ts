import { Router } from 'express';
import {
    getVariantFlowController,
    getVariantFlowSummaryController
} from './productFlow.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/variants/:id', requirePermission(['reports.view', 'inventory.manage']), getVariantFlowController);
router.get('/variants/:id/summary', requirePermission(['reports.view', 'inventory.manage']), getVariantFlowSummaryController);

export default router;
