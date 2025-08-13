import { Router } from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateExistingCategory,
  deleteExistingCategory
} from '../controllers/categories.controller.js';

const router = Router();

router.get('/', getCategories);

router.get('/:id', getCategory);

router.post('/', createCategory);

router.put('/:id', updateExistingCategory);

router.delete('/:id', deleteExistingCategory);

export default router;
