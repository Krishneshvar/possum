/**
 * Customer Routes
 */
import express from 'express';
import * as CustomerController from './customer.controller.js';

const router = express.Router();

// GET /api/customers - Get customers with search and pagination
router.get('/', CustomerController.getCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', CustomerController.getCustomerById);

// POST /api/customers - Create a new customer
router.post('/', CustomerController.createCustomer);

// PUT /api/customers/:id - Update a customer
router.put('/:id', CustomerController.updateCustomer);

// DELETE /api/customers/:id - Delete a customer
router.delete('/:id', CustomerController.deleteCustomer);

export default router;
