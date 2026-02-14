import { Router } from 'express';
import * as ProductController from './product.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';
import { upload } from '../../shared/middleware/upload.middleware.js';

const router = Router();

// Allow anyone who can sell or view reports to see products
router.get('/', requirePermission(['VIEW_REPORTS', 'COMPLETE_SALE', 'CREATE_PRODUCT']), ProductController.getProducts);

// Image upload handling via multer
router.post('/', requirePermission('CREATE_PRODUCT'), upload.single('image'), ProductController.createProduct);
router.get('/:id', requirePermission(['VIEW_REPORTS', 'COMPLETE_SALE', 'CREATE_PRODUCT']), ProductController.getProduct);
router.put('/:id', requirePermission('EDIT_PRODUCT'), upload.single('image'), ProductController.updateProduct);
router.delete('/:id', requirePermission('DELETE_PRODUCT'), ProductController.deleteProduct);

export default router;
