import { Router } from 'express';
import {
  getProducts,
  getProductDetails,
  createProduct,
  updateProductController,
  deleteProductController
} from '../controllers/products.controller.js';

const router = Router();

router.get('/', getProducts);

router.get('/:id', getProductDetails);

router.post('/', createProduct);

router.put('/:id', updateProductController);

router.delete('/:id', deleteProductController);

export default router;
