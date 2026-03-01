/**
 * Supplier Repository
 * Database operations for suppliers
 */
import { getDB } from '../../electron/backend/shared/db/index.js';
import { Supplier, PaymentPolicy } from '../../types/index.js';
import type { ISupplierRepository, SupplierQueryOptions, SupplierQueryResult } from '../../core/index.js';

interface CountRow {
    count: number;
}

export class SupplierRepository implements ISupplierRepository {
    /**
     * Get all suppliers with pagination, search and sorting
     */
    getAllSuppliers({ page: pageInput = 1, limit: limitInput = 10, searchTerm = '', paymentPolicyId, sortBy = 'name', sortOrder = 'ASC' }: SupplierQueryOptions = {}): SupplierQueryResult {
        const page = Number(pageInput);
        const limit = Number(limitInput);
        const db = getDB();
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE s.deleted_at IS NULL';
        const params: any[] = [];

        if (searchTerm) {
            whereClause += ` AND (s.name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.address LIKE ? OR s.gstin LIKE ?)`;
            const likePattern = `%${searchTerm}%`;
            params.push(likePattern, likePattern, likePattern, likePattern, likePattern, likePattern);
        }

        if (paymentPolicyId) {
            whereClause += ' AND s.payment_policy_id = ?';
            params.push(paymentPolicyId);
        }

        const sortFieldMap: Record<NonNullable<SupplierQueryOptions['sortBy']>, string> = {
            'name': 's.name',
            'contact_person': 's.contact_person',
            'phone': 's.phone',
            'email': 's.email',
            'created_at': 's.created_at'
        };
        const sortColumn = sortFieldMap[sortBy] || 's.name';
        const direction = sortOrder === 'DESC' ? 'DESC' : 'ASC';

        const countQuery = `SELECT COUNT(*) as count FROM suppliers s ${whereClause}`;
        const totalCount = (db.prepare(countQuery).get(...params) as CountRow).count;

        const dataQuery = `
        SELECT 
            s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.gstin, s.payment_policy_id, s.created_at, s.updated_at,
            pp.name as payment_policy_name
        FROM suppliers s
        LEFT JOIN payment_policies pp ON s.payment_policy_id = pp.id
        ${whereClause} 
        ORDER BY ${sortColumn} ${direction} 
        LIMIT ? OFFSET ?
    `;
        const suppliers = db.prepare(dataQuery).all(...params, limit, offset) as (Supplier & { payment_policy_name?: string })[];

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
    findSupplierById(id: number) {
        const db = getDB();
        return db.prepare(`
        SELECT 
            s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.gstin, s.payment_policy_id, s.created_at, s.updated_at,
            pp.name as payment_policy_name
        FROM suppliers s
        LEFT JOIN payment_policies pp ON s.payment_policy_id = pp.id
        WHERE s.id = ? AND s.deleted_at IS NULL
    `).get(id) as (Supplier & { payment_policy_name?: string }) | undefined;
    }

    /**
     * Create a new supplier
     * @param {Object} supplier - { name, contact_person, phone, email }
     * @returns {Object} Result of operation
     */
    createSupplier({ name, contact_person, phone, email, address, gstin, payment_policy_id }: Partial<Supplier>) {
        const db = getDB();
        const stmt = db.prepare(`
        INSERT INTO suppliers (name, contact_person, phone, email, address, gstin, payment_policy_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(name, contact_person, phone, email, address, gstin, payment_policy_id ?? 1);
    }

    /**
     * Update a supplier
     * @param {number} id 
     * @param {Object} data - fields to update
     */
    updateSupplier(id: number, { name, contact_person, phone, email, address, gstin, payment_policy_id }: Partial<Supplier>) {
        const db = getDB();
        const sets: string[] = [];
        const args: Array<string | number | null> = [];

        if (name !== undefined) { sets.push('name = ?'); args.push(name); }
        if (contact_person !== undefined) { sets.push('contact_person = ?'); args.push(contact_person ?? null); }
        if (phone !== undefined) { sets.push('phone = ?'); args.push(phone ?? null); }
        if (email !== undefined) { sets.push('email = ?'); args.push(email ?? null); }
        if (address !== undefined) { sets.push('address = ?'); args.push(address ?? null); }
        if (gstin !== undefined) { sets.push('gstin = ?'); args.push(gstin ?? null); }
        if (payment_policy_id !== undefined) { sets.push('payment_policy_id = ?'); args.push(payment_policy_id ?? null); }

        if (sets.length === 0) return { changes: 0 };

        args.push(id);
        const stmt = db.prepare(`UPDATE suppliers SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`);
        return stmt.run(...args);
    }

    /**
     * Soft delete a supplier
     * @param {number} id 
     */
    deleteSupplier(id: number) {
        const db = getDB();
        return db.prepare(`
        UPDATE suppliers
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
    `).run(id);
    }

    /**
     * Get all payment policies
     */
    getPaymentPolicies(): PaymentPolicy[] {
        const db = getDB();
        return db.prepare(`
            SELECT id, name, days_to_pay, description, created_at, updated_at
            FROM payment_policies
            WHERE deleted_at IS NULL
            ORDER BY name ASC
        `).all() as PaymentPolicy[];
    }

    /**
     * Create a new payment policy
     */
    createPaymentPolicy(data: { name: string, days_to_pay: number, description?: string }) {
        const db = getDB();
        const stmt = db.prepare(`
            INSERT INTO payment_policies (name, days_to_pay, description)
            VALUES (?, ?, ?)
        `);
        return stmt.run(data.name, data.days_to_pay, data.description ?? null);
    }
}
