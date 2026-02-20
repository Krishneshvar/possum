/**
 * Supplier Repository
 * Database operations for suppliers
 */
import { getDB } from '../../shared/db/index.js';

export interface Supplier {
    id: number;
    name: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstin?: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface SupplierQueryOptions {
    page?: number;
    limit?: number;
    searchTerm?: string;
    sortBy?: 'name' | 'contact_person' | 'phone' | 'email' | 'created_at';
    sortOrder?: 'ASC' | 'DESC';
}

interface CountRow {
    count: number;
}

/**
 * Get all suppliers with pagination, search and sorting
 */
export function getAllSuppliers({ page = 1, limit = 10, searchTerm = '', sortBy = 'name', sortOrder = 'ASC' }: SupplierQueryOptions = {}) {
    const db = getDB();
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE deleted_at IS NULL';
    const params: string[] = [];

    if (searchTerm) {
        whereClause += ` AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ? OR gstin LIKE ?)`;
        const likePattern = `%${searchTerm}%`;
        params.push(likePattern, likePattern, likePattern, likePattern, likePattern, likePattern);
    }

    const sortFieldMap: Record<NonNullable<SupplierQueryOptions['sortBy']>, string> = {
        'name': 'name',
        'contact_person': 'contact_person',
        'phone': 'phone',
        'email': 'email',
        'created_at': 'created_at'
    };
    const sortColumn = sortFieldMap[sortBy] || 'name';
    const direction = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `SELECT COUNT(*) as count FROM suppliers ${whereClause}`;
    const totalCount = (db.prepare(countQuery).get(...params) as CountRow).count;

    const dataQuery = `
        SELECT id, name, contact_person, phone, email, address, gstin, created_at, updated_at
        FROM suppliers 
        ${whereClause} 
        ORDER BY ${sortColumn} ${direction} 
        LIMIT ? OFFSET ?
    `;
    const suppliers = db.prepare(dataQuery).all(...params, limit, offset) as Supplier[];

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
export function findSupplierById(id: number) {
    const db = getDB();
    return db.prepare(`
        SELECT id, name, contact_person, phone, email, address, gstin, created_at, updated_at
        FROM suppliers
        WHERE id = ? AND deleted_at IS NULL
    `).get(id) as Supplier | undefined;
}

/**
 * Create a new supplier
 * @param {Object} supplier - { name, contact_person, phone, email }
 * @returns {Object} Result of operation
 */
export function createSupplier({ name, contact_person, phone, email, address, gstin }: Partial<Supplier>) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO suppliers (name, contact_person, phone, email, address, gstin)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(name, contact_person, phone, email, address, gstin);
}

/**
 * Update a supplier
 * @param {number} id 
 * @param {Object} data - fields to update
 */
export function updateSupplier(id: number, { name, contact_person, phone, email, address, gstin }: Partial<Supplier>) {
    const db = getDB();
    const sets: string[] = [];
    const args: Array<string | number | null> = [];

    if (name !== undefined) { sets.push('name = ?'); args.push(name); }
    if (contact_person !== undefined) { sets.push('contact_person = ?'); args.push(contact_person ?? null); }
    if (phone !== undefined) { sets.push('phone = ?'); args.push(phone ?? null); }
    if (email !== undefined) { sets.push('email = ?'); args.push(email ?? null); }
    if (address !== undefined) { sets.push('address = ?'); args.push(address ?? null); }
    if (gstin !== undefined) { sets.push('gstin = ?'); args.push(gstin ?? null); }

    if (sets.length === 0) return { changes: 0 };

    args.push(id);
    const stmt = db.prepare(`UPDATE suppliers SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`);
    return stmt.run(...args);
}

/**
 * Soft delete a supplier
 * @param {number} id 
 */
export function deleteSupplier(id: number) {
    const db = getDB();
    return db.prepare(`
        UPDATE suppliers
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
    `).run(id);
}
