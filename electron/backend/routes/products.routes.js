import { Router } from 'express';
import multer from 'multer';
import {
  getProductsController,
  getProductDetails,
  createProductController,
  updateProductController,
  deleteProductController
} from '../controllers/products.controller.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// Define the absolute path to the project root's 'uploads' directory
const uploadDir = path.join(process.cwd(), 'uploads');

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Create a unique filename for the image
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Refined handlers for file uploads
router.post('/', upload.single('image'), (req, res, next) => {
  // Now we can access req.body and req.file
  console.log('Final Body:', req.body);
  console.log('Final File:', req.file);
  createProductController(req, res, next);
});

router.put('/:id', upload.single('image'), (req, res, next) => {
  // Now we can access req.body and req.file
  console.log('Final Body:', req.body);
  console.log('Final File:', req.file);
  updateProductController(req, res, next);
});

router.get('/', getProductsController);
router.get('/:id', getProductDetails);
router.delete('/:id', deleteProductController);

export default router;
