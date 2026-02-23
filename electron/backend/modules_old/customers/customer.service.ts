/**
 * Customer Service
 * Logic layer for customer operations
 */
import * as CustomerRepository from './customer.repository.js';
import * as auditService from '../audit/audit.service.js';
import { Customer } from '../../../../types/index.js';
import { getDB } from '../../shared/db/index.js';

type CustomerWriteInput = {
    userId?: number;
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
};

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
    const error = new Error(message) as Error & { statusCode: number };
    error.statusCode = statusCode;
    return error;
}

function normalizeCustomerWriteInput(data: CustomerWriteInput): CustomerRepository.CustomerWriteFields {
    return {
        name: data.name?.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
    };
}

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
    if (!Number.isInteger(id) || id <= 0) {
        throw httpError('Customer ID must be a positive integer', 400);
    }
    const customer = CustomerRepository.findCustomerById(id);
    if (!customer) {
        throw httpError(`Customer with ID ${id} not found`, 404);
    }
    return customer;
}

/**
 * Create a new customer
 */
export async function createCustomer(data: CustomerWriteInput): Promise<Customer> {
    if (!data.userId) {
        throw httpError('Unauthorized: No user session', 401);
    }

    const normalizedData = normalizeCustomerWriteInput(data);
    if (!normalizedData.name) {
        throw httpError('Customer name is required', 400);
    }

    const db = getDB();
    const tx = db.transaction(() => {
        const customer = CustomerRepository.insertCustomer(normalizedData);

        if (!customer) {
            throw httpError('Failed to create customer', 500);
        }

        auditService.logCreate(data.userId!, 'customers', customer.id, customer);
        return customer;
    });

    try {
        return tx();
    } catch (error: any) {
        if (error?.message?.includes('UNIQUE constraint failed')) {
            throw httpError('Customer with this phone or email already exists', 409);
        }
        throw error;
    }
}

/**
 * Update a customer
 */
export async function updateCustomer(id: number, data: CustomerWriteInput): Promise<Customer> {
    if (!data.userId) {
        throw httpError('Unauthorized: No user session', 401);
    }
    if (!Number.isInteger(id) || id <= 0) {
        throw httpError('Customer ID must be a positive integer', 400);
    }

    const normalizedData = normalizeCustomerWriteInput(data);
    if (normalizedData.name !== undefined && !normalizedData.name) {
        throw httpError('Customer name is required', 400);
    }

    const hasAnyUpdatableField = ['name', 'phone', 'email', 'address']
        .some((key) => Object.prototype.hasOwnProperty.call(data, key));
    if (!hasAnyUpdatableField) {
        throw httpError('No customer fields were provided for update', 400);
    }

    const db = getDB();
    const tx = db.transaction(() => {
        const oldCustomer = CustomerRepository.findCustomerById(id);
        if (!oldCustomer) {
            throw httpError(`Customer with ID ${id} not found`, 404);
        }

        const updatedCustomer = CustomerRepository.updateCustomerById(id, normalizedData);
        if (!updatedCustomer) {
            throw httpError('Failed to update customer', 500);
        }

        auditService.logUpdate(data.userId!, 'customers', id, oldCustomer, updatedCustomer);
        return updatedCustomer;
    });

    try {
        return tx();
    } catch (error: any) {
        if (error?.message?.includes('UNIQUE constraint failed')) {
            throw httpError('Customer with this phone or email already exists', 409);
        }
        throw error;
    }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: number, userId: number): Promise<boolean> {
    if (!userId) {
        throw httpError('Unauthorized: No user session', 401);
    }
    if (!Number.isInteger(id) || id <= 0) {
        throw httpError('Customer ID must be a positive integer', 400);
    }

    const db = getDB();
    const tx = db.transaction(() => {
        const customer = CustomerRepository.findCustomerById(id);
        if (!customer) {
            throw httpError(`Customer with ID ${id} not found`, 404);
        }

        const success = CustomerRepository.softDeleteCustomer(id);
        if (!success) {
            throw httpError('Failed to delete customer', 500);
        }

        auditService.logDelete(userId, 'customers', id, customer);
        return success;
    });

    return tx();
}
