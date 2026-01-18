/**
 * Product Routes
 * Route registration for product endpoints
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import {
    getProductsController,
    getProductDetails,
    createProductController,
    updateProductController,
    deleteProductController
} from './product.controller.js';

import {
    addVariantController,
    updateVariantController,
    deleteVariantController,
    getVariantsController
} from '../variants/variant.controller.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// ==============================================
// IMPORTANT: Order matters in Express routing!
// More specific routes MUST come BEFORE generic :id routes
// ==============================================

// Variant routes (MUST be before /:id routes)
router.get('/variants/search', getVariantsController);
router.post('/variants', addVariantController);
router.put('/variants/:id', updateVariantController);
router.delete('/variants/:id', deleteVariantController);

// Product routes
router.post('/', upload.single('image'), createProductController);
router.put('/:id', upload.single('image'), updateProductController);
router.get('/', getProductsController);
router.get('/:id', getProductDetails);
router.delete('/:id', deleteProductController);

export default router;
