/**
 * Supplier Service
 * Business logic for suppliers
 */
import * as supplierRepo from './supplier.repository.js';

export function getAllSuppliers() {
    return supplierRepo.getAllSuppliers();
}

export function getSupplierById(id) {
    return supplierRepo.findSupplierById(id);
}

export function createSupplier(data) {
    try {
        const result = supplierRepo.createSupplier(data);
        return { id: result.lastInsertRowid, ...data };
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            throw new Error('Supplier with this name already exists');
        }
        throw err;
    }
}

export function updateSupplier(id, data) {
    const result = supplierRepo.updateSupplier(id, data);
    if (result.changes === 0) {
        // Check if supplier exists
        if (!supplierRepo.findSupplierById(id)) {
            throw new Error('Supplier not found');
        }
    }
    return { id, ...data };
}

export function deleteSupplier(id) {
    const result = supplierRepo.deleteSupplier(id);
    if (result.changes === 0) {
        throw new Error('Supplier not found');
    }
    return { success: true };
}
