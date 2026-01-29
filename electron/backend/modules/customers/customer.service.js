/**
 * Customer Service
 * Logic layer for customer operations
 */
import * as CustomerRepository from './customer.repository.js';
import * as auditService from '../audit/audit.service.js';

/**
 * Get customers with search and pagination
 */
export async function getCustomers(params) {
    return CustomerRepository.findCustomers(params);
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id) {
    const customer = CustomerRepository.findCustomerById(id);
    if (!customer) {
        throw new Error(`Customer with ID ${id} not found`);
    }
    return customer;
}

/**
 * Create a new customer
 */
export async function createCustomer(data) {
    const result = CustomerRepository.insertCustomer(data);
    const customerId = result.lastInsertRowid;

    // Log customer creation
    auditService.logCreate(data.userId || 1, 'customers', customerId, data);

    return result;
}

/**
 * Update a customer
 */
export async function updateCustomer(id, data) {
    const oldCustomer = await getCustomerById(id); // Ensure exists
    const result = CustomerRepository.updateCustomerById(id, data);

    // Log customer update
    if (result.changes > 0) {
        const newCustomer = CustomerRepository.findCustomerById(id);
        auditService.logUpdate(data.userId || 1, 'customers', id, oldCustomer, newCustomer);
    }

    return result;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id, userId) {
    const customer = await getCustomerById(id); // Ensure exists
    const result = CustomerRepository.softDeleteCustomer(id);

    // Log customer deletion
    if (result.changes > 0) {
        auditService.logDelete(userId || 1, 'customers', id, customer);
    }

    return result;
}
