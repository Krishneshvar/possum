/**
 * User Repository
 * Handles all database operations for users
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Find users with filtering and pagination
 */
export function findUsers({ searchTerm, currentPage = 1, itemsPerPage = 10 }) {
    const db = getDB();
    const filterClauses = [];
    const filterParams = [];

    filterClauses.push(`deleted_at IS NULL`);

    if (searchTerm) {
        filterClauses.push(`(name LIKE ? OR username LIKE ?)`);
        filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    const whereClause = `WHERE ${filterClauses.join(' AND ')}`;

    const countQuery = `
    SELECT COUNT(id) as total FROM users ${whereClause}
  `;
    const totalCount = db.prepare(countQuery).get(...filterParams).total;

    const paginatedQuery = `
    SELECT id, name, username, is_active, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedParams = [...filterParams, itemsPerPage, startIndex];

    const paginatedUsers = db.prepare(paginatedQuery).all(...paginatedParams);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
        users: paginatedUsers,
        totalCount,
        totalPages
    };
}

/**
 * Find a user by ID
 */
export function findUserById(id) {
    const db = getDB();
    return db.prepare('SELECT id, name, username, is_active, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL').get(id);
}

/**
 * Find user by username (for login or duplicate check)
 */
export function findUserByUsername(username) {
    const db = getDB();
    return db.prepare('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL').get(username);
}

/**
 * Insert a new user
 */
export function insertUser({ name, username, password_hash, is_active }) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO users (name, username, password_hash, is_active)
        VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, username, password_hash, is_active ?? 1);
    return findUserById(result.lastInsertRowid);
}

/**
 * Update a user
 */
export function updateUserById(id, { name, username, password_hash, is_active }) {
    const db = getDB();
    const updates = [];
    const params = [];

    if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
    }
    if (username !== undefined) {
        updates.push('username = ?');
        params.push(username);
    }
    if (password_hash !== undefined) {
        updates.push('password_hash = ?');
        params.push(password_hash);
    }
    if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length > 1) { // >1 because updated_at is always there
        const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params, id);
    }
    return findUserById(id);
}

/**
 * Soft delete a user
 */
export function softDeleteUser(id) {
    const db = getDB();
    const stmt = db.prepare('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}
