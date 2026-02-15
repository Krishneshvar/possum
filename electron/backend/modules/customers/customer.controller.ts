/**
 * Customer Controller
 * Handles HTTP requests related to customers
 */
import { Request, Response } from 'express';
import * as CustomerService from './customer.service.js';

/**
 * Get customers with search and pagination
 */
export async function getCustomers(req: Request, res: Response) {
    try {
        const { searchTerm, currentPage, itemsPerPage } = req.query;

        const params = {
            searchTerm: (searchTerm as string) || '',
            currentPage: parseInt(currentPage as string) || 1,
            itemsPerPage: parseInt(itemsPerPage as string) || 10
        };

        const result = await CustomerService.getCustomers(params);
        res.json(result);
    } catch (error: any) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const customer = await CustomerService.getCustomerById(Number(id));
        res.json(customer);
    } catch (error: any) {
        console.error('Error fetching customer:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
}

/**
 * Create a new customer
 */
export async function createCustomer(req: Request, res: Response) {
    try {
        const customerData = { ...req.body, userId: req.user?.id || 1 };
        const customer = await CustomerService.createCustomer(customerData);
        res.status(201).json(customer);
    } catch (error: any) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
}

/**
 * Update a customer
 */
export async function updateCustomer(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const customerData = { ...req.body, userId: req.user?.id || 1 };
        const customer = await CustomerService.updateCustomer(Number(id), customerData);
        res.json(customer);
    } catch (error: any) {
        console.error('Error updating customer:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await CustomerService.deleteCustomer(Number(id), req.user?.id || 1);
        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
}
