/**
 * Customer Repository
 * Handles all database operations for customers
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Find customers with filtering and pagination
 * @param {Object} params - Filter and pagination params
 * @returns {Object} Customers list with pagination info
 */
export function findCustomers({ searchTerm, currentPage = 1, itemsPerPage = 10 }) {
    const db = getDB();
    const filterClauses = [];
    const filterParams = [];

    filterClauses.push(`deleted_at IS NULL`);

    if (searchTerm) {
        // Search by name, id (if numeric), phone, or email
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
    const totalCount = db.prepare(countQuery).get(...filterParams).total;

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

    const paginatedCustomers = db.prepare(paginatedQuery).all(...paginatedParams);

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
export function findCustomerById(id) {
    const db = getDB();
    return db.prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL').get(id);
}

/**
 * Insert a new customer
 */
export function insertCustomer({ name, phone, email, address }) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO customers (name, phone, email, address)
        VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, phone, email, address);
    return findCustomerById(result.lastInsertRowid);
}
