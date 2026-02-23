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
router.get('/stats', requirePermission(['products.view', 'products.manage', 'sales.create']), getVariantStatsController);
router.get('/', requirePermission(['products.view', 'products.manage', 'sales.create']), getVariantsController);
router.post('/', requirePermission('products.manage'), addVariantController);
router.put('/:id', requirePermission('products.manage'), updateVariantController);
router.delete('/:id', requirePermission('products.manage'), deleteVariantController);

export default router;
