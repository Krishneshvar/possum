/**
 * Variant Controller
 * Handles HTTP requests for variants
 */
import * as variantService from './variant.service.js';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString } from '../../shared/utils/index.js';

/**
 * POST /api/products/variants
 * Add a variant to a product
 */
export async function addVariantController(req: Request, res: Response) {
    const { productId } = req.body;
    const variantData = req.body;

    if (!productId || !variantData.name) {
        return res.status(400).json({ error: 'Product ID and variant name are required.' });
    }

    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
    const userId = req.user.id;

    try {
        const newVariant = variantService.addVariant(productId, { ...variantData, userId });
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
export async function updateVariantController(req: Request, res: Response) {
    const { id } = req.params;
    const variantData = req.body;

    if (!variantData.name) {
        return res.status(400).json({ error: 'Variant name is required.' });
    }

    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
    const userId = req.user.id;

    try {
        const changes = variantService.updateVariant({
            ...variantData,
            id: parseInt(id as string, 10),
            userId
        });
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
export async function deleteVariantController(req: Request, res: Response) {
    const { id } = req.params;

    try {
        const changes = variantService.deleteVariant(parseInt(id as string, 10));
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
export async function getVariantsController(req: Request, res: Response) {
    try {
        const {
            searchTerm,
            categoryId,
            stockStatus,
            sortBy,
            sortOrder,
            page,
            limit
        } = req.query;

        const result = await variantService.getVariants({
            searchTerm: getQueryString(searchTerm) || '',
            categoryId: getQueryNumber(categoryId),
            stockStatus: getQueryString(stockStatus),
            sortBy: getQueryString(sortBy) || 'p.name',
            sortOrder: (getQueryString(sortOrder) as 'ASC' | 'DESC') || 'ASC',
            currentPage: getQueryNumber(page, 1) || 1,
            itemsPerPage: getQueryNumber(limit, 10) || 10
        });

        res.json(result);
    } catch (err) {
        console.error('Error in getVariantsController:', err);
        res.status(500).json({ error: 'Failed to retrieve variants.' });
    }
}

/**
 * GET /api/variants/stats
 * Get variant statistics
 */
export async function getVariantStatsController(req: Request, res: Response) {
    try {
        const stats = await variantService.getVariantStats();
        res.json(stats);
    } catch (err) {
        console.error('Error in getVariantStatsController:', err);
        res.status(500).json({ error: 'Failed to retrieve variant statistics.' });
    }
}
