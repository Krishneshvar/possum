import express from 'express';
import * as taxController from './tax.controller.js';

const router = express.Router();

router.get('/', taxController.getTaxesController);
router.post('/', taxController.createTaxController);
router.put('/:id', taxController.updateTaxController);
router.delete('/:id', taxController.deleteTaxController);

export default router;
