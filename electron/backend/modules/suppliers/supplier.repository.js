/**
 * Supplier Repository
 * Database operations for suppliers
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Get all suppliers with pagination, search and sorting
 */
export function getAllSuppliers({ page = 1, limit = 10, searchTerm = '', sortBy = 'name', sortOrder = 'ASC' } = {}) {
    const db = getDB();
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE deleted_at IS NULL';
    const params = [];

    if (searchTerm) {
        whereClause += ` AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ?)`;
        params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    const sortFieldMap = {
        'name': 'name',
        'contact_person': 'contact_person',
        'phone': 'phone',
        'email': 'email'
    };
    const sortColumn = sortFieldMap[sortBy] || 'name';
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `SELECT COUNT(*) as count FROM suppliers ${whereClause}`;
    const totalCount = db.prepare(countQuery).get(...params).count;

    const dataQuery = `
        SELECT * FROM suppliers 
        ${whereClause} 
        ORDER BY ${sortColumn} ${direction} 
        LIMIT ? OFFSET ?
    `;
    const suppliers = db.prepare(dataQuery).all(...params, limit, offset);

    return {
        suppliers,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        page,
        limit
    };
}

/**
 * Find supplier by ID
 * @param {number} id 
 * @returns {Object|undefined} Supplier or undefined
 */
export function findSupplierById(id) {
    const db = getDB();
    return db.prepare('SELECT * FROM suppliers WHERE id = ? AND deleted_at IS NULL').get(id);
}

/**
 * Create a new supplier
 * @param {Object} supplier - { name, contact_person, phone, email }
 * @returns {Object} Result of operation
 */
export function createSupplier({ name, contact_person, phone, email }) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO suppliers (name, contact_person, phone, email)
        VALUES (?, ?, ?, ?)
    `);
    return stmt.run(name, contact_person, phone, email);
}

/**
 * Update a supplier
 * @param {number} id 
 * @param {Object} data - fields to update
 */
export function updateSupplier(id, { name, contact_person, phone, email }) {
    const db = getDB();
    const sets = [];
    const args = [];

    if (name !== undefined) { sets.push('name = ?'); args.push(name); }
    if (contact_person !== undefined) { sets.push('contact_person = ?'); args.push(contact_person); }
    if (phone !== undefined) { sets.push('phone = ?'); args.push(phone); }
    if (email !== undefined) { sets.push('email = ?'); args.push(email); }

    if (sets.length === 0) return { changes: 0 };

    args.push(id);
    const stmt = db.prepare(`UPDATE suppliers SET ${sets.join(', ')} WHERE id = ?`);
    return stmt.run(...args);
}

/**
 * Soft delete a supplier
 * @param {number} id 
 */
export function deleteSupplier(id) {
    const db = getDB();
    return db.prepare('UPDATE suppliers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
}
