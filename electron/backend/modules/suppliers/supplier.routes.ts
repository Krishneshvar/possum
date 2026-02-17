/**
 * Supplier Routes
 * API endpoints for suppliers
 */
import { Router } from 'express';
import * as supplierController from './supplier.controller.js';

const router = Router();

router.get('/', supplierController.getSuppliers);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

export default router;
