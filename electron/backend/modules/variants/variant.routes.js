/**
 * Variant Routes
 * Route registration for variant endpoints
 */
import { Router } from 'express';

import {
    getVariantsController,
    addVariantController,
    updateVariantController,
    deleteVariantController
} from './variant.controller.js';

const router = Router();

router.get('/', getVariantsController);
router.post('/', addVariantController);
router.put('/:id', updateVariantController);
router.delete('/:id', deleteVariantController);

export default router;
