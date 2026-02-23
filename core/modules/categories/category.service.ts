import type { Category } from '../../../types/index.js';
import type { ICategoryRepository } from './category.repository.interface.js';

let categoryRepository: ICategoryRepository;

export function initCategoryService(repo: ICategoryRepository) {
  categoryRepository = repo;
}

/**
 * Build a tree structure from flat categories
 * @param {Array} categories - Flat category list
 * @param {number|null} parentId - Parent ID to filter by
 * @returns {Array} Tree structure
 */
function buildCategoryTree(categories: Category[], parentId: number | null = null): Category[] {
    const tree: Category[] = [];
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
export function getCategoryById(id: number) {
    return categoryRepository.findCategoryById(id);
}

/**
 * Create a new category
 * @param {string} name - Category name
 * @param {number|null} parentId - Parent category ID
 * @returns {Object} Created category
 */
export function createCategory(name: string, parentId: number | null = null) {
    return categoryRepository.insertCategory(name, parentId);
}

/**
 * Update a category
 * @param {number} id - Category ID
 * @param {Object} data - Update data
 * @returns {Object} Update result
 */
export function updateCategory(id: number, data: { name?: string; parentId?: number | null }) {
    return categoryRepository.updateCategoryById(id, data);
}

/**
 * Delete a category
 * @param {number} id - Category ID
 * @returns {Object} Delete result
 */
export function deleteCategory(id: number) {
    return categoryRepository.softDeleteCategory(id);
}
