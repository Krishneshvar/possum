/**
 * Supplier Controller
 * HTTP request handlers for suppliers
 */
import * as supplierService from '../../../../core/index.js';
import { Request, Response, NextFunction } from 'express';

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

export function getSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
        const { page, limit, searchTerm, sortBy, sortOrder, paymentPolicyId } = req.query;
        const suppliers = supplierService.getAllSuppliers({
            page: getQueryNumber(page, 1) || 1,
            limit: getQueryNumber(limit, 10) || 10,
            searchTerm: getQueryString(searchTerm),
            paymentPolicyId: paymentPolicyId ? getQueryNumber(paymentPolicyId, 0) : undefined,
            sortBy: getQueryString(sortBy) as 'name' | 'contact_person' | 'phone' | 'email' | 'created_at' | undefined,
            sortOrder: getQueryString(sortOrder) as 'ASC' | 'DESC' | undefined
        });
        res.json(suppliers);
    } catch (error: any) {
        next(error);
    }
}

export function createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const supplierData = { ...req.body, userId: req.user.id };
        const newSupplier = supplierService.createSupplier(supplierData);
        res.status(201).json(newSupplier);
    } catch (error: any) {
        next(error);
    }
}

export function updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const supplierData = { ...req.body, userId: req.user.id };
        const updatedSupplier = supplierService.updateSupplier(parseInt(id as string, 10), supplierData);
        res.json(updatedSupplier);
    } catch (error: any) {
        next(error);
    }
}

export function deleteSupplier(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        supplierService.deleteSupplier(parseInt(id as string, 10), req.user.id);
        res.json({ message: 'Supplier archived successfully' });
    } catch (error: any) {
        next(error);
    }
}

export function getPaymentPolicies(req: Request, res: Response, next: NextFunction) {
    try {
        const policies = supplierService.getPaymentPolicies();
        res.json(policies);
    } catch (error: any) {
        next(error);
    }
}

export function createPaymentPolicy(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const { name, days_to_pay, description } = req.body;
        const newPolicy = supplierService.createPaymentPolicy({ name, days_to_pay, description });
        res.status(201).json(newPolicy);
    } catch (error: any) {
        next(error);
    }
}
