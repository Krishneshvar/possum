/**
 * Category Service
 * Contains business logic for category operations
 */
import * as categoryRepository from './category.repository.js';

/**
 * Build a tree structure from flat categories
 * @param {Array} categories - Flat category list
 * @param {number|null} parentId - Parent ID to filter by
 * @returns {Array} Tree structure
 */
function buildCategoryTree(categories, parentId = null) {
    const tree = [];
    categories
        .filter(category => category.parent_id === parentId)
        .forEach(category => {
            const children = buildCategoryTree(categories, category.id);
            if (children.length > 0) {
                category.subcategories = children;
            }
            tree.push(category);
        });
    return tree;
}

/**
 * Get categories as a tree structure
 * @returns {Array} Category tree
 */
export function getCategoriesAsTree() {
    const allCategories = categoryRepository.findAllCategories();
    return buildCategoryTree(allCategories);
}

/**
 * Get all categories (flat)
 * @returns {Array} All categories
 */
export function getAllCategories() {
    return categoryRepository.findAllCategories();
}

/**
 * Get a category by ID
 * @param {number} id - Category ID
 * @returns {Object|null} Category or null
 */
export function getCategoryById(id) {
    return categoryRepository.findCategoryById(id);
}

/**
 * Create a new category
 * @param {string} name - Category name
 * @param {number|null} parentId - Parent category ID
 * @returns {Object} Created category
 */
export function createCategory(name, parentId = null) {
    return categoryRepository.insertCategory(name, parentId);
}

/**
 * Update a category
 * @param {number} id - Category ID
 * @param {Object} data - Update data
 * @returns {Object} Update result
 */
export function updateCategory(id, data) {
    return categoryRepository.updateCategoryById(id, data);
}

/**
 * Delete a category
 * @param {number} id - Category ID
 * @returns {Object} Delete result
 */
export function deleteCategory(id) {
    return categoryRepository.softDeleteCategory(id);
}
