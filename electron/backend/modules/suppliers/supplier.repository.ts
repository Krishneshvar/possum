/**
 * Supplier Repository
 * Database operations for suppliers
 */
import { getDB } from '../../shared/db/index.js';

export interface Supplier {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface SupplierQueryOptions {
    page?: number;
    limit?: number;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * Get all suppliers with pagination, search and sorting
 */
export function getAllSuppliers({ page = 1, limit = 10, searchTerm = '', sortBy = 'name', sortOrder = 'ASC' }: SupplierQueryOptions = {}) {
    const db = getDB();
    const offset = (page! - 1) * limit!;

    let whereClause = 'WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (searchTerm) {
        whereClause += ` AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ?)`;
        params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    const sortFieldMap: Record<string, string> = {
        'name': 'name',
        'contact_person': 'contact_person',
        'phone': 'phone',
        'email': 'email'
    };
    const sortColumn = sortFieldMap[sortBy!] || 'name';
    const direction = sortOrder!.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `SELECT COUNT(*) as count FROM suppliers ${whereClause}`;
    const totalCount = (db.prepare(countQuery).get(...params) as any).count;

    const dataQuery = `
        SELECT * FROM suppliers 
        ${whereClause} 
        ORDER BY ${sortColumn} ${direction} 
        LIMIT ? OFFSET ?
    `;
    const suppliers = db.prepare(dataQuery).all(...params, limit, offset) as Supplier[];

    return {
        suppliers,
        totalCount,
        totalPages: Math.ceil(totalCount / limit!),
        page,
        limit
    };
}

/**
 * Find supplier by ID
 * @param {number} id 
 * @returns {Object|undefined} Supplier or undefined
 */
export function findSupplierById(id: number) {
    const db = getDB();
    return db.prepare('SELECT * FROM suppliers WHERE id = ? AND deleted_at IS NULL').get(id) as Supplier | undefined;
}

/**
 * Create a new supplier
 * @param {Object} supplier - { name, contact_person, phone, email }
 * @returns {Object} Result of operation
 */
export function createSupplier({ name, contact_person, phone, email }: Partial<Supplier>) {
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
export function updateSupplier(id: number, { name, contact_person, phone, email }: Partial<Supplier>) {
    const db = getDB();
    const sets: string[] = [];
    const args: any[] = [];

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
export function deleteSupplier(id: number) {
    const db = getDB();
    return db.prepare('UPDATE suppliers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
}
