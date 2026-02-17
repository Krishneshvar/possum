/**
 * Supplier Routes
 * API endpoints for suppliers
 */
import { Router } from 'express';
import * as supplierController from './supplier.controller.js';

import { validate } from '../../shared/middleware/validate.middleware.js';
import { createSupplierSchema, updateSupplierSchema, getSupplierSchema } from './supplier.schema.js';

const router = Router();

router.get('/', supplierController.getSuppliers);
router.post('/', validate(createSupplierSchema), supplierController.createSupplier);
router.put('/:id', validate(updateSupplierSchema), supplierController.updateSupplier);
router.delete('/:id', validate(getSupplierSchema), supplierController.deleteSupplier);

export default router;
