// backend/routes/variants.routes.js

import { Router } from 'express';
import {
  getVariantsByProduct,
  getVariant,
  createVariant,
  updateExistingVariant,
  deleteExistingVariant
} from '../controllers/variants.controller.js';

const router = Router();

router.get('/products/:productId', getVariantsByProduct);

router.get('/:id', getVariant);

router.post('/', createVariant);

router.put('/:id', updateExistingVariant);

router.delete('/:id', deleteExistingVariant);

export default router;
