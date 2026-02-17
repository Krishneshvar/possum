import express from 'express';
import * as CustomerController from './customer.controller.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createCustomerSchema, updateCustomerSchema, getCustomerSchema } from './customer.schema.js';

const router = express.Router();

// GET /api/customers - Get customers with search and pagination
router.get('/', CustomerController.getCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', validate(getCustomerSchema), CustomerController.getCustomerById);

// POST /api/customers - Create a new customer
router.post('/', validate(createCustomerSchema), CustomerController.createCustomer);

// PUT /api/customers/:id - Update a customer
router.put('/:id', validate(updateCustomerSchema), CustomerController.updateCustomer);

// DELETE /api/customers/:id - Delete a customer
router.delete('/:id', validate(getCustomerSchema), CustomerController.deleteCustomer);

export default router;
