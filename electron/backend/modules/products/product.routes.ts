/**
 * Product Routes
 * Defines API routes for product operations
 */
import { Router } from 'express';
import {
    getProductsController,
    createProductController,
    getProductDetails,
    updateProductController,
    deleteProductController
} from './product.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';
import { upload } from '../../shared/middleware/upload.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createProductSchema, updateProductSchema, getProductSchema } from './product.schema.js';

const router = Router();

// Allow anyone who can sell or view reports to see products
router.get('/', requirePermission(['reports.view', 'sales.create', 'products.manage']), getProductsController);

// Image upload handling via multer
router.post('/', requirePermission('products.manage'), upload.single('image'), validate(createProductSchema), createProductController);
router.get('/:id', requirePermission(['reports.view', 'sales.create', 'products.manage']), validate(getProductSchema), getProductDetails);
router.put('/:id', requirePermission('products.manage'), upload.single('image'), validate(updateProductSchema), updateProductController);
router.delete('/:id', requirePermission('products.manage'), validate(getProductSchema), deleteProductController);

export default router;
