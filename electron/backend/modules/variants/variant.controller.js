/**
 * Variant Controller
 * Handles HTTP requests for variants
 */
import * as variantService from './variant.service.js';

/**
 * POST /api/products/variants
 * Add a variant to a product
 */
export async function addVariantController(req, res) {
    const { productId } = req.body;
    const variantData = req.body;

    if (!productId || !variantData.name) {
        return res.status(400).json({ error: 'Product ID and variant name are required.' });
    }

    try {
        const newVariant = variantService.addVariant(productId, variantData);
        if (newVariant.changes === 0) {
            return res.status(400).json({ error: 'Failed to add variant.' });
        }
        res.status(201).json({ id: newVariant.lastInsertRowid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add variant.' });
    }
}

/**
 * PUT /api/products/variants/:id
 * Update a variant
 */
export async function updateVariantController(req, res) {
    const { id } = req.params;
    const variantData = req.body;

    if (!variantData.name) {
        return res.status(400).json({ error: 'Variant name is required.' });
    }

    try {
        const changes = variantService.updateVariant({ ...variantData, id: parseInt(id, 10) });
        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Variant not found or no changes made.' });
        }
        res.status(200).json({ message: 'Variant updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update variant.' });
    }
}

/**
 * DELETE /api/products/variants/:id
 * Delete a variant
 */
export async function deleteVariantController(req, res) {
    const { id } = req.params;

    try {
        const changes = variantService.deleteVariant(parseInt(id, 10));
        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Variant not found.' });
        }
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete variant.' });
    }
}

/**
 * GET /api/variants
 * Get variants with filtering, pagination, and sorting
 */
export async function getVariantsController(req, res) {
    try {
        const {
            searchTerm = '',
            sortBy = 'p.name',
            sortOrder = 'ASC',
            page = 1,
            limit = 10
        } = req.query;

        const result = variantService.getVariants({
            searchTerm,
            sortBy,
            sortOrder,
            currentPage: parseInt(page, 10),
            itemsPerPage: parseInt(limit, 10)
        });

        res.json(result);
    } catch (err) {
        console.error('Error in getVariantsController:', err);
        res.status(500).json({ error: 'Failed to retrieve variants.' });
    }
}
