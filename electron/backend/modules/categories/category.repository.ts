/**
 * Category Repository
 * Handles all database operations for categories
 */
import { getDB } from '../../shared/db/index.js';

export interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    subcategories?: Category[];
}

/**
 * Get all categories ordered by name
 * @returns {Array} All categories
 */
export function findAllCategories() {
    const db = getDB();
    return db.prepare('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC').all() as Category[];
}

/**
 * Find a category by ID
 * @param {number} id - Category ID
 * @returns {Object|null} Category or null
 */
export function findCategoryById(id: number) {
    const db = getDB();
    return db.prepare('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL').get(id) as Category | undefined;
}

/**
 * Insert a new category
 * @param {string} name - Category name
 * @param {number|null} parentId - Parent category ID
 * @returns {Object} Insert result
 */
export function insertCategory(name: string, parentId: number | null = null) {
    const db = getDB();
    const stmt = db.prepare('INSERT INTO categories (name, parent_id) VALUES (?, ?)');
    const info = stmt.run(name, parentId);
    return { id: info.lastInsertRowid };
}

/**
 * Update a category
 * @param {number} id - Category ID
 * @param {Object} data - Update data
 * @returns {Object} Update result
 */
export function updateCategoryById(id: number, { name, parentId }: { name?: string; parentId?: number | null }) {
    const db = getDB();
    let updateFields = ['updated_at = CURRENT_TIMESTAMP'];
    let params: any[] = [];

    if (name !== undefined) {
        updateFields.push('name = ?');
        params.push(name);
    }

    if (parentId !== undefined) {
        updateFields.push('parent_id = ?');
        params.push(parentId);
    }

    if (updateFields.length === 1) {
        return { changes: 0 };
    }

    const stmt = db.prepare(`
    UPDATE categories
    SET ${updateFields.join(', ')}
    WHERE id = ? AND deleted_at IS NULL
  `);

    params.push(id);
    const info = stmt.run(...params);
    return { changes: info.changes };
}

/**
 * Soft delete a category
 * @param {number} id - Category ID
 * @returns {Object} Delete result
 */
export function softDeleteCategory(id: number) {
    const db = getDB();
    const stmt = db.prepare('UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
    const info = stmt.run(id);
    return { changes: info.changes };
}
