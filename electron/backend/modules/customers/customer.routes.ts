import express from 'express';
import * as CustomerController from './customer.controller.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createCustomerSchema, updateCustomerSchema, getCustomerSchema } from './customer.schema.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

// GET /api/customers - Get customers with search and pagination
router.get('/', requirePermission(['customers.manage', 'sales.create']), CustomerController.getCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', requirePermission(['customers.manage', 'sales.create']), validate(getCustomerSchema), CustomerController.getCustomerById);

// POST /api/customers - Create a new customer
router.post('/', requirePermission('customers.manage'), validate(createCustomerSchema), CustomerController.createCustomer);

// PUT /api/customers/:id - Update a customer
router.put('/:id', requirePermission('customers.manage'), validate(updateCustomerSchema), CustomerController.updateCustomer);

// DELETE /api/customers/:id - Delete a customer
router.delete('/:id', requirePermission('customers.manage'), validate(getCustomerSchema), CustomerController.deleteCustomer);

export default router;
