/**
 * Customer Controller
 * Handles HTTP requests related to customers
 */
import { NextFunction, Request, Response } from 'express';
import * as CustomerService from './customer.service.js';

function getQueryNumber(param: unknown, defaultValue: number): number {
    if (typeof param === 'number' && Number.isFinite(param)) {
        return param;
    }
    if (typeof param === 'string') {
        const parsed = Number.parseInt(param, 10);
        return Number.isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
}

function getQueryString(param: unknown): string | undefined {
    if (typeof param === 'string') {
        return param;
    }
    return undefined;
}

/**
 * Get customers with search and pagination
 */
export async function getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
        const { searchTerm, page, limit, currentPage, itemsPerPage, sortBy, sortOrder } = req.query;

        const params = {
            searchTerm: getQueryString(searchTerm),
            page: getQueryNumber(page, getQueryNumber(currentPage, 1)),
            limit: getQueryNumber(limit, getQueryNumber(itemsPerPage, 10)),
            sortBy: getQueryString(sortBy) as 'name' | 'email' | 'created_at' | undefined,
            sortOrder: getQueryString(sortOrder) as 'ASC' | 'DESC' | undefined
        };

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
