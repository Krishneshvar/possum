/**
 * Product Flow Routes
 * Defines API routes for product flow analysis
 */
import { Router } from 'express';
import {
    getVariantFlowController,
    getVariantFlowSummaryController
} from './productFlow.controller.js';

const router = Router();

router.get('/variants/:id', getVariantFlowController);
router.get('/variants/:id/summary', getVariantFlowSummaryController);

export default router;
