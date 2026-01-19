/**
 * Return Routes
 * Defines API routes for returns operations
 */
import { Router } from 'express';
import {
    createReturnController,
    getReturnController,
    getReturnsController
} from './return.controller.js';

const router = Router();

router.post('/', createReturnController);
router.get('/', getReturnsController);
router.get('/:id', getReturnController);

export default router;
