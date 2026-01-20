/**
 * Customer Controller
 * Handles HTTP requests related to customers
 */
import * as CustomerService from './customer.service.js';

/**
 * Get customers with search and pagination
 */
export async function getCustomers(req, res) {
    try {
        const { searchTerm, currentPage, itemsPerPage } = req.query;

        const params = {
            searchTerm: searchTerm || '',
            currentPage: parseInt(currentPage) || 1,
            itemsPerPage: parseInt(itemsPerPage) || 10
        };

        const result = await CustomerService.getCustomers(params);
        res.json(result);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(req, res) {
    try {
        const { id } = req.params;
        const customer = await CustomerService.getCustomerById(parseInt(id));
        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
}

/**
 * Create a new customer
 */
export async function createCustomer(req, res) {
    try {
        const customer = await CustomerService.createCustomer(req.body);
        res.status(201).json(customer);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
}

/**
 * Update a customer
 */
export async function updateCustomer(req, res) {
    try {
        const { id } = req.params;
        const customer = await CustomerService.updateCustomer(parseInt(id), req.body);
        res.json(customer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(req, res) {
    try {
        const { id } = req.params;
        await CustomerService.deleteCustomer(parseInt(id));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
}
