import * as taxRepository from './tax.repository.js';

/**
 * GET /api/taxes
 * Get all active taxes
 */
export async function getTaxesController(req, res) {
    try {
        const taxes = taxRepository.findAllTaxes();
        res.json(taxes);
    } catch (err) {
        console.error('Error fetching taxes:', err);
        res.status(500).json({ error: 'Failed to retrieve taxes.', details: err.message });
    }
}

/**
 * POST /api/taxes
 * Create a new tax
 */
export async function createTaxController(req, res) {
    const { name, rate, type } = req.body;

    if (!name || rate === undefined || !type) {
        return res.status(400).json({ error: 'Name, rate, and type (inclusive/exclusive) are required.' });
    }

    try {
        const result = taxRepository.insertTax({ name, rate, type });
        res.status(201).json({ id: result.lastInsertRowid, name, rate, type });
    } catch (err) {
        console.error('Error creating tax:', err);
        res.status(500).json({ error: 'Failed to create tax.', details: err.message });
    }
}

/**
 * PUT /api/taxes/:id
 * Update a tax
 */
export async function updateTaxController(req, res) {
    const { id } = req.params;
    const { name, rate, type, is_active } = req.body;

    try {
        const result = taxRepository.updateTax(id, { name, rate, type, is_active });
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Tax not found or no changes made.' });
        }
        res.json({ message: 'Tax updated successfully.' });
    } catch (err) {
        console.error('Error updating tax:', err);
        res.status(500).json({ error: 'Failed to update tax.', details: err.message });
    }
}

/**
 * DELETE /api/taxes/:id
 * Soft delete a tax
 */
export async function deleteTaxController(req, res) {
    const { id } = req.params;

    try {
        const result = taxRepository.softDeleteTax(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Tax not found.' });
        }
        res.status(204).end();
    } catch (err) {
        console.error('Error deleting tax:', err);
        res.status(500).json({ error: 'Failed to delete tax.', details: err.message });
    }
}
