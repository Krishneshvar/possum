import { Router } from 'express';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

import {
    getCategoriesController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
} from './category.controller.js';

const router = Router();

router.get('/', getCategoriesController);
router.post('/', requirePermission('products.manage'), createCategoryController);
router.put('/:id', requirePermission('products.manage'), updateCategoryController);
router.delete('/:id', requirePermission('products.manage'), deleteCategoryController);

export default router;
