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
