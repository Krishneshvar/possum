/**
 * Supplier Service
 * Business logic for suppliers
 */
import * as supplierRepo from './supplier.repository.js';
import * as auditService from '../audit/audit.service.js';
import { Supplier, SupplierQueryOptions } from './supplier.repository.js';
import { getDB } from '../../shared/db/index.js';

export function getAllSuppliers(options: SupplierQueryOptions) {
    return supplierRepo.getAllSuppliers(options);
}

export function getSupplierById(id: number) {
    return supplierRepo.findSupplierById(id);
}

type SupplierWriteInput = Partial<Supplier> & { userId?: number };

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
    const error = new Error(message) as Error & { statusCode: number };
    error.statusCode = statusCode;
    return error;
}

function normalizeSupplierInput(data: SupplierWriteInput): Partial<Supplier> {
    return {
        name: data.name?.trim(),
        contact_person: data.contact_person?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        gstin: data.gstin?.trim() || null,
    };
}

export function createSupplier(data: SupplierWriteInput) {
    if (!data.userId) {
        throw httpError('Unauthorized: No user session', 401);
    }

    const normalizedData = normalizeSupplierInput(data);
    if (!normalizedData.name) {
        throw httpError('Supplier name is required', 400);
    }

    const db = getDB();
    const transaction = db.transaction(() => {
        const result = supplierRepo.createSupplier(normalizedData);
        const supplierId = Number(result.lastInsertRowid);

        const createdSupplier = supplierRepo.findSupplierById(supplierId);
        if (!createdSupplier) {
            throw httpError('Failed to fetch created supplier', 500);
        }

        auditService.logCreate(data.userId!, 'suppliers', supplierId, createdSupplier);
        return createdSupplier;
    });

    try {
        return transaction();
    } catch (err: any) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            throw httpError('Supplier with this name already exists', 409);
        }
        throw err;
    }
}

export function updateSupplier(id: number, data: SupplierWriteInput) {
    if (!data.userId) {
        throw httpError('Unauthorized: No user session', 401);
    }

    const normalizedData = normalizeSupplierInput(data);
    if (normalizedData.name !== undefined && !normalizedData.name) {
        throw httpError('Supplier name is required', 400);
    }

    const db = getDB();
    const transaction = db.transaction(() => {
        const oldSupplier = supplierRepo.findSupplierById(id);
        if (!oldSupplier) {
            throw httpError('Supplier not found', 404);
        }

        const result = supplierRepo.updateSupplier(id, normalizedData);
        if (result.changes === 0) {
            throw httpError('No supplier fields were updated', 400);
        }

        const newSupplier = supplierRepo.findSupplierById(id);
        if (!newSupplier) {
            throw httpError('Supplier not found', 404);
        }

        auditService.logUpdate(data.userId!, 'suppliers', id, oldSupplier, newSupplier);
        return newSupplier;
    });

    try {
        return transaction();
    } catch (err: any) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            throw httpError('Supplier with this name already exists', 409);
        }
        throw err;
    }
}

export function deleteSupplier(id: number, userId: number) {
    if (!userId) {
        throw httpError('Unauthorized: No user session', 401);
    }

    const db = getDB();
    const transaction = db.transaction(() => {
        const supplier = supplierRepo.findSupplierById(id);
        if (!supplier) {
            throw httpError('Supplier not found', 404);
        }

        const result = supplierRepo.deleteSupplier(id);
        if (result.changes === 0) {
            throw httpError('Supplier not found', 404);
        }

        auditService.logDelete(userId, 'suppliers', id, supplier);
        return { success: true };
    });

    return transaction();
}
