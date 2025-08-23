import { Router } from 'express';
import {
  getProductsController,
  getProductDetails,
  createProductController,
  updateProductController,
  deleteProductController
} from '../controllers/products.controller.js';

const router = Router();

router.get('/', getProductsController);

router.get('/:id', getProductDetails);

router.post('/', createProductController);

router.put('/:id', updateProductController);

router.delete('/:id', deleteProductController);

export default router;
