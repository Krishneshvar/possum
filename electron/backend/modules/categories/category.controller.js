/**
 * Category Controller
 * Handles HTTP requests for categories
 */
import * as categoryService from './category.service.js';

/**
 * GET /api/categories
 * Get all categories as tree
 */
export function getCategoriesController(req, res) {
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
export function createCategoryController(req, res) {
    const { name, parentId = null } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Category name is required.' });
    }
    try {
        const newCategory = categoryService.createCategory(name, parentId);
        res.status(201).json(newCategory);
    } catch (err) {
        console.error(err);
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'A category with this name already exists.' });
        }
        res.status(500).json({ error: 'Failed to create category.' });
    }
}

/**
 * PUT /api/categories/:id
 * Update a category
 */
export function updateCategoryController(req, res) {
    const { id } = req.params;
    const { name, parentId } = req.body;

    try {
        const changes = categoryService.updateCategory(parseInt(id, 10), { name, parentId });
        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Category not found or no changes made.' });
        }
        res.status(200).json({ message: 'Category updated successfully.' });
    } catch (err) {
        console.error(err);
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'A category with this name already exists.' });
        }
        res.status(500).json({ error: 'Failed to update category.' });
    }
}

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
export function deleteCategoryController(req, res) {
    const { id } = req.params;
    try {
        const changes = categoryService.deleteCategory(parseInt(id, 10));
        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete category.' });
    }
}
