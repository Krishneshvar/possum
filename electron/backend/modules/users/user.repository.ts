/**
 * User Repository
 * Handles all database operations for users
 */
import { getDB } from '../../shared/db/index.js';
import { User, Role } from '../../../../types/index.js';

export interface UserFilter {
    searchTerm?: string;
    currentPage?: number;
    itemsPerPage?: number;
}

export interface PaginatedUsers {
    users: User[];
    totalCount: number;
    totalPages: number;
}

/**
 * Find users with filtering and pagination
 */
export function findUsers({ searchTerm, currentPage = 1, itemsPerPage = 10 }: UserFilter): PaginatedUsers {
    const db = getDB();
    const filterClauses: string[] = [];
    const filterParams: any[] = [];

    filterClauses.push(`deleted_at IS NULL`);

    if (searchTerm) {
        filterClauses.push(`(name LIKE ? OR username LIKE ?)`);
        filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    const whereClause = `WHERE ${filterClauses.join(' AND ')}`;

    const countQuery = `
    SELECT COUNT(id) as total FROM users ${whereClause}
  `;
    const totalCount = (db.prepare(countQuery).get(...filterParams) as { total: number }).total;

    const paginatedQuery = `
    SELECT id, name, username, is_active, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedParams = [...filterParams, itemsPerPage, startIndex];

    const paginatedUsers = db.prepare(paginatedQuery).all(...paginatedParams) as User[];
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
export function findUserById(id: number): User | undefined {
    const db = getDB();
    return db.prepare('SELECT id, name, username, is_active, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL').get(id) as User | undefined;
}

/**
 * Find user by username (for login or duplicate check)
 */
export function findUserByUsername(username: string): User | undefined {
    const db = getDB();
    return db.prepare('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL').get(username) as User | undefined;
}

/**
 * Insert a new user
 */
export function insertUser({ name, username, password_hash, is_active }: Partial<User>): User | undefined {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO users (name, username, password_hash, is_active)
        VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, username, password_hash, is_active ?? 1);
    return findUserById(Number(result.lastInsertRowid));
}

/**
 * Update a user
 */
export function updateUserById(id: number, { name, username, password_hash, is_active }: Partial<User>): User | undefined {
    const db = getDB();
    const updates: string[] = [];
    const params: any[] = [];

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
export function softDeleteUser(id: number): boolean {
    const db = getDB();
    const stmt = db.prepare('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

/**
 * Get roles for a user
 */
export function getUserRoles(userId: number): Role[] {
    const db = getDB();
    const query = `
        SELECT r.id, r.name
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
    `;
    return db.prepare(query).all(userId) as Role[];
}

/**
 * Get all permissions for a user (via their roles)
 */
export function getUserPermissions(userId: number): string[] {
    const db = getDB();
    const query = `
        SELECT DISTINCT p.key
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
    `;
    const results = db.prepare(query).all(userId) as { key: string }[];
    return results.map(p => p.key);
}

/**
 * Assign roles to a user
 */
export function assignUserRoles(userId: number, roleIds: number[]): void {
    const db = getDB();
    const deleteStmt = db.prepare('DELETE FROM user_roles WHERE user_id = ?');
    const insertStmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');

    const transaction = db.transaction((uId: number, rIds: number[]) => {
        deleteStmt.run(uId);
        for (const roleId of rIds) {
            insertStmt.run(uId, roleId);
        }
    });

    transaction(userId, roleIds);
}

/**
 * Get all available roles
 */
export function getAllRoles(): Role[] {
    const db = getDB();
    return db.prepare('SELECT * FROM roles ORDER BY name ASC').all() as Role[];
}

export function getAllPermissions(): { id: number; key: string; description: string }[] {
    const db = getDB();
    return db.prepare('SELECT * FROM permissions ORDER BY key ASC').all() as { id: number; key: string; description: string }[];
}
