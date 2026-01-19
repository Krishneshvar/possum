/**
 * Customer Service
 * Logic layer for customer operations
 */
import * as CustomerRepository from './customer.repository.js';

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
    // Basic validation can be added here
    return CustomerRepository.insertCustomer(data);
}
