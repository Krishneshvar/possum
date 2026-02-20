/**
 * Variant Controller
 * Handles HTTP requests for variants
 */
import * as variantService from './variant.service.js';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString } from '../../shared/utils/index.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * POST /api/products/variants
 * Add a variant to a product
 */
export async function addVariantController(req: Request, res: Response) {
    const { productId, name, sku, price, cost_price, stock_alert_cap, is_default, status, stock } = req.body;

    if (!productId || !name || price == null || cost_price == null) {
        return res.status(400).json({ error: 'Product ID, name, price, and cost_price are required.' });
    }

    if (!req.user?.id) {
        return res.status(401).json({ error: 'Unauthorized: No user session' });
    }

    try {
        const newVariant = variantService.addVariant({
            productId: parseInt(String(productId), 10),
            name,
            sku,
            price: parseFloat(String(price)),
            cost_price: parseFloat(String(cost_price)),
            stock_alert_cap: stock_alert_cap ? parseInt(String(stock_alert_cap), 10) : undefined,
            is_default,
            status,
            stock: stock ? parseInt(String(stock), 10) : undefined,
            userId: req.user.id
        });

        if (newVariant.changes === 0) {
            return res.status(400).json({ error: 'Failed to add variant.' });
        }
        res.status(201).json({ id: newVariant.lastInsertRowid });
    } catch (err: any) {
        logger.error(`Error adding variant: ${err.message}`);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Failed to add variant.' });
    }
}

/**
 * PUT /api/products/variants/:id
 * Update a variant
 */
export async function updateVariantController(req: Request, res: Response) {
    const { id } = req.params;
    const { name, sku, price, cost_price, stock_alert_cap, is_default, status, stock } = req.body;

    if (!name || price == null || cost_price == null) {
        return res.status(400).json({ error: 'Name, price, and cost_price are required.' });
    }

    if (!req.user?.id) {
        return res.status(401).json({ error: 'Unauthorized: No user session' });
    }

    try {
        const changes = variantService.updateVariant({
            id: parseInt(id as string, 10),
            name,
            sku,
            price: parseFloat(String(price)),
            cost_price: parseFloat(String(cost_price)),
            stock_alert_cap: stock_alert_cap ? parseInt(String(stock_alert_cap), 10) : undefined,
            is_default,
            status,
            stock: stock !== undefined ? parseInt(String(stock), 10) : undefined,
            userId: req.user.id
        });

        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Variant not found or no changes made.' });
        }
        res.status(200).json({ message: 'Variant updated successfully.' });
    } catch (err: any) {
        logger.error(`Error updating variant ${id}: ${err.message}`);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Failed to update variant.' });
    }
}

/**
 * DELETE /api/products/variants/:id
 * Delete a variant
 */
export async function deleteVariantController(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.user?.id) {
        return res.status(401).json({ error: 'Unauthorized: No user session' });
    }

    try {
        const changes = variantService.deleteVariant(parseInt(id as string, 10), req.user.id);
        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Variant not found.' });
        }
        res.status(204).end();
    } catch (err: any) {
        logger.error(`Error deleting variant ${id}: ${err.message}`);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Failed to delete variant.' });
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
            status,
            sortBy,
            sortOrder,
            page,
            limit
        } = req.query;

        const result = await variantService.getVariants({
            searchTerm: getQueryString(searchTerm) || '',
            categoryId: getQueryNumber(categoryId),
            stockStatus: stockStatus as string | string[],
            status: status as string | string[],
            sortBy: getQueryString(sortBy) || 'p.name',
            sortOrder: (getQueryString(sortOrder) as 'ASC' | 'DESC') || 'ASC',
            currentPage: getQueryNumber(page, 1) || 1,
            itemsPerPage: getQueryNumber(limit, 10) || 10
        });

        res.json(result);
    } catch (err: any) {
        logger.error(`Error in getVariantsController: ${err.message}`);
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
    } catch (err: any) {
        logger.error(`Error in getVariantStatsController: ${err.message}`);
        res.status(500).json({ error: 'Failed to retrieve variant statistics.' });
    }
}
