import { Router } from 'express';
import {
  getProducts,
  getProductDetails,
  createProduct,
  updateProduct,
  deleteProductController
} from '../controllers/products.controller.js';

const router = Router();

router.get('/', getProducts);

router.get('/:id', getProductDetails);

router.post('/', createProduct);

router.put('/:id', updateProduct);

router.delete('/:id', deleteProductController);

export default router;
