import express from 'express';
import * as taxController from './tax.controller.js';

const router = express.Router();

router.get('/', taxController.getTaxesController);
router.post('/', taxController.createTaxController);

export default router;
