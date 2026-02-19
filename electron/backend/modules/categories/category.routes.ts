import { Router } from 'express';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createCategorySchema, updateCategorySchema, getCategorySchema } from './category.schema.js';

import {
    getCategoriesController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
} from './category.controller.js';

const router = Router();

router.get('/', getCategoriesController);
router.post('/', requirePermission('products.manage'), validate(createCategorySchema), createCategoryController);
router.put('/:id', requirePermission('products.manage'), validate(updateCategorySchema), updateCategoryController);
router.delete('/:id', requirePermission('products.manage'), validate(getCategorySchema), deleteCategoryController);

export default router;
