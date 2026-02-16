/**
 * Supplier Service
 * Business logic for suppliers
 */
import * as supplierRepo from './supplier.repository.js';
import * as auditService from '../audit/audit.service.js';
import { Supplier, SupplierQueryOptions } from './supplier.repository.js';

export function getAllSuppliers(options: SupplierQueryOptions) {
    return supplierRepo.getAllSuppliers(options);
}

export function getSupplierById(id: number) {
    return supplierRepo.findSupplierById(id);
}

export function createSupplier(data: Partial<Supplier> & { userId?: number }) {
    try {
        const result = supplierRepo.createSupplier(data);
        const supplierId = Number(result.lastInsertRowid);

        // Log supplier creation
        auditService.logCreate(data.userId || 1, 'suppliers', supplierId, data);

        return { id: supplierId, ...data };
    } catch (err: any) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            throw new Error('Supplier with this name already exists');
        }
        throw err;
    }
}

export function updateSupplier(id: number, data: Partial<Supplier> & { userId?: number }) {
    const oldSupplier = supplierRepo.findSupplierById(id);
    if (!oldSupplier) {
        throw new Error('Supplier not found');
    }

    const result = supplierRepo.updateSupplier(id, data);

    // Log supplier update
    if (result.changes > 0) {
        const newSupplier = supplierRepo.findSupplierById(id);
        auditService.logUpdate(data.userId || 1, 'suppliers', id, oldSupplier, newSupplier);
    }

    return { id, ...data };
}

export function deleteSupplier(id: number, userId: number) {
    const supplier = supplierRepo.findSupplierById(id);
    if (!supplier) {
        throw new Error('Supplier not found');
    }

    const result = supplierRepo.deleteSupplier(id);

    // Log supplier deletion
    if (result.changes > 0) {
        auditService.logDelete(userId, 'suppliers', id, supplier);
    }

    return { success: true };
}
