/**
 * Supplier Controller
 * HTTP request handlers for suppliers
 */
import * as supplierService from './supplier.service.js';

export function getSuppliers(req, res) {
    try {
        const { page, limit, searchTerm, sortBy, sortOrder } = req.query;
        const suppliers = supplierService.getAllSuppliers({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            searchTerm,
            sortBy,
            sortOrder
        });
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
}

export function createSupplier(req, res) {
    try {
        const supplierData = { ...req.body, userId: req.userId || 1 };
        const newSupplier = supplierService.createSupplier(supplierData);
        res.status(201).json(newSupplier);
    } catch (error) {
        console.error('Error creating supplier:', error);
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create supplier' });
    }
}

export function updateSupplier(req, res) {
    try {
        const { id } = req.params;
        const supplierData = { ...req.body, userId: req.userId || 1 };
        const updatedSupplier = supplierService.updateSupplier(id, supplierData);
        res.json(updatedSupplier);
    } catch (error) {
        console.error('Error updating supplier:', error);
        if (error.message === 'Supplier not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update supplier' });
    }
}

export function deleteSupplier(req, res) {
    try {
        const { id } = req.params;
        supplierService.deleteSupplier(id, req.userId || 1);
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        if (error.message === 'Supplier not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
}
