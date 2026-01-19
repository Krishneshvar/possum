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
