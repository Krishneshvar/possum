/**
 * Customer Repository
 * Handles all database operations for customers
 */
import { getDB } from '../../electron/backend/shared/db/index.js';
import { Customer } from '../../types/index.js';
import type { ICustomerRepository, CustomerWriteFields, CustomerFilter, PaginatedCustomers } from '../../core/index.js';

interface CustomerRow {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  loyalty_points: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    loyalty_points: row.loyalty_points ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

export class CustomerRepository implements ICustomerRepository {
/**
 * Find customers with filtering and pagination
 * @param {Object} params - Filter and pagination params
 * @returns {Object} Customers list with pagination info
 */
findCustomers({
  searchTerm,
  page,
  limit,
  currentPage = 1,
  itemsPerPage = 10,
  sortBy = 'name',
  sortOrder = 'ASC'
}: CustomerFilter): PaginatedCustomers {
  const db = getDB();
  const filterClauses: string[] = [];
  const filterParams: Array<string | number> = [];
  const safeSearchTerm = searchTerm?.trim();
  const safePageInput = page ?? currentPage;
  const safeLimitInput = limit ?? itemsPerPage;
  const safePage = Math.max(1, Number.isFinite(safePageInput) ? safePageInput : 1);
  const safeLimit = Math.max(1, Math.min(1000, Number.isFinite(safeLimitInput) ? safeLimitInput : 10));

  filterClauses.push(`deleted_at IS NULL`);

  if (safeSearchTerm) {
    // Search by name, id (if numeric), phone, or email
    const isNumeric = /^\d+$/.test(safeSearchTerm);
    if (isNumeric) {
      filterClauses.push(`(name LIKE ? OR id = ? OR phone LIKE ?)`);
      filterParams.push(`%${safeSearchTerm}%`, Number.parseInt(safeSearchTerm, 10), `%${safeSearchTerm}%`);
    } else {
      filterClauses.push(`(name LIKE ? OR email LIKE ? OR phone LIKE ?)`);
      filterParams.push(`%${safeSearchTerm}%`, `%${safeSearchTerm}%`, `%${safeSearchTerm}%`);
    }
  }

  const whereClause = `WHERE ${filterClauses.join(' AND ')}`;
  const allowedSortFields: Array<NonNullable<CustomerFilter['sortBy']>> = ['name', 'email', 'created_at'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';

  const countQuery = `
    SELECT
      COUNT(id) as total
    FROM customers
    ${whereClause}
  `;
  const totalCount = (db.prepare(countQuery).get(...filterParams) as { total: number }).total;

  const paginatedQuery = `
    SELECT
      id,
      name,
      phone,
      email,
      address,
      loyalty_points,
      created_at,
      updated_at,
      deleted_at
    FROM customers
    ${whereClause}
    ORDER BY ${sortField} ${order}
    LIMIT ? OFFSET ?
  `;

  const startIndex = (safePage - 1) * safeLimit;
  const paginatedParams = [...filterParams, safeLimit, startIndex];

  const paginatedCustomers = (db.prepare(paginatedQuery).all(...paginatedParams) as CustomerRow[]).map(toCustomer);

  const totalPages = totalCount > 0 ? Math.ceil(totalCount / safeLimit) : 1;

  return {
    customers: paginatedCustomers,
    totalCount: totalCount,
    totalPages,
    page: safePage,
    limit: safeLimit,
  };
}

/**
 * Find a customer by ID
 * @param {number} id - Customer ID
 * @returns {Object|null} Customer or null
 */
findCustomerById(id: number): Customer | undefined {
  const db = getDB();
  const row = db
    .prepare(`
      SELECT id, name, phone, email, address, loyalty_points, created_at, updated_at, deleted_at
      FROM customers
      WHERE id = ? AND deleted_at IS NULL
    `)
    .get(id) as CustomerRow | undefined;
  return row ? toCustomer(row) : undefined;
}

/**
 * Insert a new customer
 */
insertCustomer({ name, phone, email, address }: CustomerWriteFields): Customer | undefined {
  const db = getDB();
  const stmt = db.prepare(`
        INSERT INTO customers (name, phone, email, address)
        VALUES (?, ?, ?, ?)
    `);
  const result = stmt.run(name, phone, email, address);
  return this.findCustomerById(Number(result.lastInsertRowid));
}

/**
 * Update a customer
 */
updateCustomerById(id: number, { name, phone, email, address }: CustomerWriteFields): Customer | undefined {
  const db = getDB();
  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    params.push(address);
  }

  if (updates.length > 0) {
    params.push(id); // push id for WHERE clause
    const stmt = db.prepare(`UPDATE customers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`);
    stmt.run(...params);
  }
  return this.findCustomerById(id);
}

/**
 * Soft delete a customer
 */
softDeleteCustomer(id: number): boolean {
  const db = getDB();
  const stmt = db.prepare('UPDATE customers SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL');
  const result = stmt.run(id);
  return result.changes > 0;
}
}
