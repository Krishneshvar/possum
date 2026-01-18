/**
 * Category Routes
 * Route registration for category endpoints
 */
import { Router } from 'express';

import {
    getCategoriesController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
} from './category.controller.js';

const router = Router();

router.get('/', getCategoriesController);
router.post('/', createCategoryController);
router.put('/:id', updateCategoryController);
router.delete('/:id', deleteCategoryController);

export default router;
