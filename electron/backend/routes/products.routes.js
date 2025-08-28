import { Router } from 'express';
import multer from 'multer';
import {
  getProductsController,
  getProductDetails,
  createProductController,
  updateProductController,
  deleteProductController,
  addVariantController,
  updateVariantController,
  deleteVariantController
} from '../controllers/products.controller.js';
import path from 'path';
import fs from 'fs';

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

router.post('/', upload.single('image'), (req, res, next) => {
  createProductController(req, res, next);
});

router.put('/:id', upload.single('image'), (req, res, next) => {
  updateProductController(req, res, next);
});

router.get('/', getProductsController);
router.get('/:id', getProductDetails);
router.delete('/:id', deleteProductController);

router.post('/variants', addVariantController);
router.put('/variants/:id', updateVariantController);
router.delete('/variants/:id', deleteVariantController);

export default router;
