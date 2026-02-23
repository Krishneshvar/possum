/**
 * Customer Controller
 * Handles HTTP requests related to customers
 */
import { NextFunction, Request, Response } from 'express';
import * as CustomerService from '../../../../core/index.js';
import { CustomerFilter } from '../../../../core/index.js';

/**
 * Get customers with search and pagination
 */
export async function getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
        const params = req.query as CustomerFilter;
        const result = await CustomerService.getCustomers(params);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const parsedId = Number(id);
        const customer = await CustomerService.getCustomerById(parsedId);
        res.json(customer);
    } catch (error) {
        next(error);
    }
}

/**
 * Create a new customer
 */
export async function createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const customerData = { ...req.body, userId: req.user.id };
        const customer = await CustomerService.createCustomer(customerData);
        res.status(201).json(customer);
    } catch (error) {
        next(error);
    }
}

/**
 * Update a customer
 */
export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const customerData = { ...req.body, userId: req.user.id };
        const parsedId = Number(id);
        const customer = await CustomerService.updateCustomer(parsedId, customerData);
        res.json(customer);
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const parsedId = Number(id);
        await CustomerService.deleteCustomer(parsedId, req.user.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
