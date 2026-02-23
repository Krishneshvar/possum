/**
 * Category Controller
 * Handles HTTP requests for categories
 */
import * as categoryService from '../../../../packages/core/src/modules/categories/category.service.js';
import { Request, Response } from 'express';

/**
 * GET /api/categories
 * Get all categories as tree
 */
export function getCategoriesController(req: Request, res: Response) {
    try {
        const categories = categoryService.getCategoriesAsTree();
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve categories.' });
    }
}

/**
 * POST /api/categories
 * Create a new category
 */
export function createCategoryController(req: Request, res: Response) {
    const { name, parentId = null } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Category name is required.' });
    }
    try {
        const newCategory = categoryService.createCategory(name, parentId);
        res.status(201).json(newCategory);
    } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'A category with this name already exists.' });
        }
        res.status(500).json({ error: 'Failed to create category.' });
    }
}

/**
 * PUT /api/categories/:id
 * Update a category
 */
export function updateCategoryController(req: Request, res: Response) {
    const { id } = req.params;
    const { name, parentId } = req.body;

    try {
        const changes = categoryService.updateCategory(parseInt(id as string, 10), { name, parentId });
        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Category not found or no changes made.' });
        }
        res.status(200).json({ message: 'Category updated successfully.' });
    } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'A category with this name already exists.' });
        }
        res.status(500).json({ error: 'Failed to update category.' });
    }
}

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
export function deleteCategoryController(req: Request, res: Response) {
    const { id } = req.params;
    try {
        const changes = categoryService.deleteCategory(parseInt(id as string, 10));
        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete category.' });
    }
}
