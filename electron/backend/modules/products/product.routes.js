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

const router = Router();

// Allow anyone who can sell or view reports to see products
router.get('/', requirePermission(['VIEW_REPORTS', 'COMPLETE_SALE', 'CREATE_PRODUCT']), getProductsController);

// Image upload handling via multer
router.post('/', requirePermission('CREATE_PRODUCT'), upload.single('image'), createProductController);
router.get('/:id', requirePermission(['VIEW_REPORTS', 'COMPLETE_SALE', 'CREATE_PRODUCT']), getProductDetails);
router.put('/:id', requirePermission('EDIT_PRODUCT'), upload.single('image'), updateProductController);
router.delete('/:id', requirePermission('DELETE_PRODUCT'), deleteProductController);

export default router;
