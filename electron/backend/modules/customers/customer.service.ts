/**
 * Customer Service
 * Logic layer for customer operations
 */
import * as CustomerRepository from './customer.repository.js';
import * as auditService from '../audit/audit.service.js';
import { Customer } from '../../../../types/index.js';

/**
 * Get customers with search and pagination
 */
export async function getCustomers(params: CustomerRepository.CustomerFilter): Promise<CustomerRepository.PaginatedCustomers> {
    return CustomerRepository.findCustomers(params);
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id: number): Promise<Customer> {
    const customer = CustomerRepository.findCustomerById(id);
    if (!customer) {
        throw new Error(`Customer with ID ${id} not found`);
    }
    return customer;
}

/**
 * Create a new customer
 */
export async function createCustomer(data: any): Promise<Customer> {
    const customer = CustomerRepository.insertCustomer(data);

    if (!customer) throw new Error('Failed to create customer');

    // Log customer creation
    auditService.logCreate(data.userId || 1, 'customers', customer.id, data);

    return customer;
}

/**
 * Update a customer
 */
export async function updateCustomer(id: number, data: any): Promise<Customer> {
    const oldCustomer = await getCustomerById(id); // Ensure exists
    const updatedCustomer = CustomerRepository.updateCustomerById(id, data);

    if (!updatedCustomer) throw new Error('Failed to update customer');

    // Log customer update
    auditService.logUpdate(data.userId || 1, 'customers', id, oldCustomer, updatedCustomer);

    return updatedCustomer;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: number, userId: number): Promise<boolean> {
    const customer = await getCustomerById(id); // Ensure exists
    const success = CustomerRepository.softDeleteCustomer(id);

    // Log customer deletion
    if (success) {
        auditService.logDelete(userId || 1, 'customers', id, customer);
    }

    return success;
}
