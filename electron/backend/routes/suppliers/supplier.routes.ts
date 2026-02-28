/**
 * Supplier Routes
 * API endpoints for suppliers
 */
import { Router } from 'express';
import * as supplierController from './supplier.controller.js';

import { validate } from '../../shared/middleware/validate.middleware.js';
import { createSupplierSchema, updateSupplierSchema, getSupplierSchema, getSuppliersSchema, createPaymentPolicySchema } from './supplier.schema.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Payment policy routes (must come before /id routes)
router.get('/payment-policies', requirePermission(['suppliers.view', 'suppliers.manage', 'purchase.view', 'purchase.manage']), supplierController.getPaymentPolicies);
router.post('/payment-policies', requirePermission('suppliers.manage'), validate(createPaymentPolicySchema), supplierController.createPaymentPolicy);

router.get('/', requirePermission(['suppliers.view', 'suppliers.manage', 'purchase.view', 'purchase.manage']), validate(getSuppliersSchema), supplierController.getSuppliers);
router.post('/', requirePermission('suppliers.manage'), validate(createSupplierSchema), supplierController.createSupplier);
router.put('/:id', requirePermission('suppliers.manage'), validate(updateSupplierSchema), supplierController.updateSupplier);
router.delete('/:id', requirePermission('suppliers.manage'), validate(getSupplierSchema), supplierController.deleteSupplier);

export default router;
