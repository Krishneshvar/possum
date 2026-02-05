import { getDB } from '../../shared/db/index.js';

/**
 * Get all active taxes
 * @returns {Array} Array of taxes
 */
export function findAllTaxes() {
    const db = getDB();
    return db.prepare('SELECT * FROM taxes WHERE is_active = 1').all();
}

/**
 * Find tax by ID
 * @param {number} id - Tax ID
 * @returns {Object|null} Tax or null
 */
export function findTaxById(id) {
    const db = getDB();
    return db.prepare('SELECT * FROM taxes WHERE id = ?').get(id);
}

/**
 * Insert a new tax
 * @param {Object} taxData - Tax details
 * @returns {Object} Result
 */
export function insertTax({ name, rate, type }) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO taxes (name, rate, type, is_active)
        VALUES (?, ?, ?, 1)
    `);
    return stmt.run(name, rate, type);
}

/**
 * Update a tax
 * @param {number} id - Tax ID
 * @param {Object} taxData - Fields to update
 * @returns {Object} Result
 */
export function updateTax(id, { name, rate, type, is_active }) {
    const db = getDB();
    let updateFields = [];
    let params = [];

    if (name) {
        updateFields.push('name = ?');
        params.push(name);
    }
    if (rate !== undefined) {
        updateFields.push('rate = ?');
        params.push(rate);
    }
    if (type) {
        updateFields.push('type = ?');
        params.push(type);
    }
    if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        params.push(is_active);
    }

    if (updateFields.length === 0) return { changes: 0 };

    const stmt = db.prepare(`UPDATE taxes SET ${updateFields.join(', ')} WHERE id = ?`);
    params.push(id);
    return stmt.run(...params);
}

/**
 * Soft delete a tax (set is_active = 0)
 * @param {number} id - Tax ID
 * @returns {Object} Result
 */
export function softDeleteTax(id) {
    const db = getDB();
    const stmt = db.prepare('UPDATE taxes SET is_active = 0 WHERE id = ?');
    return stmt.run(id);
}
