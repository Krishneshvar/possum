/**
 * Supplier Service
 * Business logic for suppliers
 */
import * as supplierRepo from './supplier.repository.js';
import * as auditService from '../audit/audit.service.js';

export function getAllSuppliers(options) {
    return supplierRepo.getAllSuppliers(options);
}

export function getSupplierById(id) {
    return supplierRepo.findSupplierById(id);
}

export function createSupplier(data) {
    try {
        const result = supplierRepo.createSupplier(data);
        const supplierId = result.lastInsertRowid;

        // Log supplier creation
        auditService.logCreate(data.userId || 1, 'suppliers', supplierId, data);

        return { id: supplierId, ...data };
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            throw new Error('Supplier with this name already exists');
        }
        throw err;
    }
}

export function updateSupplier(id, data) {
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

export function deleteSupplier(id, userId) {
    const supplier = supplierRepo.findSupplierById(id);
    if (!supplier) {
        throw new Error('Supplier not found');
    }

    const result = supplierRepo.deleteSupplier(id);

    // Log supplier deletion
    if (result.changes > 0) {
        auditService.logDelete(userId || 1, 'suppliers', id, supplier);
    }

    return { success: true };
}
