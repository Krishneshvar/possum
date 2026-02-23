import { getDB } from '../../electron/backend/shared/db/index.js';
import type { Category } from '../../types/index.js';
import type { ICategoryRepository } from '../../core/index.js';

export class CategoryRepository implements ICategoryRepository {
/**
 * Get all categories ordered by name
 * @returns {Array} All categories
 */
findAllCategories() {
    const db = getDB();
    return db.prepare('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC').all() as Category[];
}

/**
 * Find a category by ID
 * @param {number} id - Category ID
 * @returns {Object|null} Category or null
 */
findCategoryById(id: number) {
    const db = getDB();
    return db.prepare('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL').get(id) as Category | undefined;
}

/**
 * Insert a new category
 * @param {string} name - Category name
 * @param {number|null} parentId - Parent category ID
 * @returns {Object} Insert result
 */
insertCategory(name: string, parentId: number | null = null): Category {
    const db = getDB();
    const stmt = db.prepare('INSERT INTO categories (name, parent_id) VALUES (?, ?)');
    const info = stmt.run(name, parentId);
    const id = Number(info.lastInsertRowid);
    return this.findCategoryById(id)!;
}

/**
 * Update a category
 * @param {number} id - Category ID
 * @param {Object} data - Update data
 * @returns {Object} Update result
 */
updateCategoryById(id: number, { name, parentId }: { name?: string; parentId?: number | null }) {
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
softDeleteCategory(id: number) {
    const db = getDB();
    const stmt = db.prepare('UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
    const info = stmt.run(id);
    return { changes: info.changes };
}
}
