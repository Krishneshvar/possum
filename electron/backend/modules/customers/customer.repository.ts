/**
 * Customer Repository
 * Handles all database operations for customers
 */
import { getDB } from '../../shared/db/index.js';
import { Customer } from '../../../../types/index.js';

export interface CustomerFilter {
  searchTerm?: string;
  currentPage?: number;
  itemsPerPage?: number;
}

export interface PaginatedCustomers {
  customers: Customer[];
  totalCount: number;
  totalPages: number;
}

/**
 * Find customers with filtering and pagination
 * @param {Object} params - Filter and pagination params
 * @returns {Object} Customers list with pagination info
 */
export function findCustomers({ searchTerm, currentPage = 1, itemsPerPage = 10 }: CustomerFilter): PaginatedCustomers {
  const db = getDB();
  const filterClauses: string[] = [];
  const filterParams: any[] = [];

  filterClauses.push(`deleted_at IS NULL`);

  if (searchTerm) {
    // Search by name, id (if numeric), phone, or email
    // Use proper typing or separate logic
    const isNumeric = /^\d+$/.test(searchTerm);
    if (isNumeric) {
      filterClauses.push(`(name LIKE ? OR id = ? OR phone LIKE ?)`);
      filterParams.push(`%${searchTerm}%`, parseInt(searchTerm), `%${searchTerm}%`);
    } else {
      filterClauses.push(`(name LIKE ? OR email LIKE ? OR phone LIKE ?)`);
      filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }
  }

  const whereClause = `WHERE ${filterClauses.join(' AND ')}`;

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
      created_at
    FROM customers
    ${whereClause}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParams = [...filterParams, itemsPerPage, startIndex];

  const paginatedCustomers = db.prepare(paginatedQuery).all(...paginatedParams) as Customer[];

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return {
    customers: paginatedCustomers,
    totalCount: totalCount,
    totalPages
  };
}

/**
 * Find a customer by ID
 * @param {number} id - Customer ID
 * @returns {Object|null} Customer or null
 */
export function findCustomerById(id: number): Customer | undefined {
  const db = getDB();
  return db.prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL').get(id) as Customer | undefined;
}

/**
 * Insert a new customer
 */
export function insertCustomer({ name, phone, email, address }: Partial<Customer>): Customer | undefined {
  const db = getDB();
  const stmt = db.prepare(`
        INSERT INTO customers (name, phone, email, address)
        VALUES (?, ?, ?, ?)
    `);
  const result = stmt.run(name, phone, email, address);
  return findCustomerById(Number(result.lastInsertRowid));
}

/**
 * Update a customer
 */
export function updateCustomerById(id: number, { name, phone, email, address }: Partial<Customer>): Customer | undefined {
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
    const stmt = db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);
  }
  return findCustomerById(id);
}

/**
 * Soft delete a customer
 */
export function softDeleteCustomer(id: number): boolean {
  const db = getDB();
  const stmt = db.prepare('UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
