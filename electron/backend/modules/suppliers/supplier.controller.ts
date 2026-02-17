/**
 * Supplier Controller
 * HTTP request handlers for suppliers
 */
import * as supplierService from './supplier.service.js';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString } from '../../shared/utils/index.js';

export function getSuppliers(req: Request, res: Response) {
    try {
        const { page, limit, searchTerm, sortBy, sortOrder } = req.query;
        const suppliers = supplierService.getAllSuppliers({
            page: getQueryNumber(page, 1) || 1,
            limit: getQueryNumber(limit, 10) || 10,
            searchTerm: getQueryString(searchTerm),
            sortBy: getQueryString(sortBy),
            sortOrder: getQueryString(sortOrder) as 'ASC' | 'DESC' | undefined
        });
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
}

export function createSupplier(req: Request, res: Response) {
    try {
        const supplierData = { ...req.body, userId: (req as any).userId || 1 };
        const newSupplier = supplierService.createSupplier(supplierData);
        res.status(201).json(newSupplier);
    } catch (error: any) {
        console.error('Error creating supplier:', error);
        if (error.message && error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create supplier' });
    }
}

export function updateSupplier(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const supplierData = { ...req.body, userId: (req as any).userId || 1 };
        const updatedSupplier = supplierService.updateSupplier(parseInt(id as string, 10), supplierData);
        res.json(updatedSupplier);
    } catch (error: any) {
        console.error('Error updating supplier:', error);
        if (error.message === 'Supplier not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update supplier' });
    }
}

export function deleteSupplier(req: Request, res: Response) {
    try {
        const { id } = req.params;
        supplierService.deleteSupplier(parseInt(id as string, 10), (req as any).userId || 1);
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting supplier:', error);
        if (error.message === 'Supplier not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
}
