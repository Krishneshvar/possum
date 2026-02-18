import { Router } from 'express';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';
import {
    addVariantController,
    updateVariantController,
    deleteVariantController,
    getVariantsController,
    getVariantStatsController
} from './variant.controller.js';

const router = Router();

// Routes for variants
router.get('/stats', requirePermission(['reports.view', 'sales.create', 'products.manage']), getVariantStatsController);
router.get('/', requirePermission(['reports.view', 'sales.create', 'products.manage']), getVariantsController);
router.post('/', requirePermission('products.manage'), addVariantController);
router.put('/:id', requirePermission('products.manage'), updateVariantController);
router.delete('/:id', requirePermission('products.manage'), deleteVariantController);

export default router;
