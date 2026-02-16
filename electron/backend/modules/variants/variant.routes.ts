/**
 * Variant Routes
 * Route registration for variant endpoints
 */
import { Router } from 'express';
import {
    addVariantController,
    updateVariantController,
    deleteVariantController,
    getVariantsController
} from './variant.controller.js';

const router = Router();

// Routes for variants
router.get('/', getVariantsController);
router.post('/', addVariantController); // Is this used? Usually part of product create.
// Wait, product create creates variants in bulk. This might be for adding a variant to existing product.
router.put('/:id', updateVariantController);
router.delete('/:id', deleteVariantController);

export default router;
