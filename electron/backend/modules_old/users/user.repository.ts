/**
 * User Repository
 * Handles all database operations for users
 */
import { getDB } from '../../shared/db/index.js';
import { User, Role, Permission } from '../../../../types/index.js';

export interface UserFilter {
    searchTerm?: string;
    currentPage?: number;
    itemsPerPage?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedUsers {
    users: User[];
    totalCount: number;
    totalPages: number;
}

interface CreateUserInput {
    name: string;
    username: string;
    password_hash: string;
    is_active?: number;
}

/**
 * Find users with filtering and pagination
 */
export function findUsers({ searchTerm, currentPage = 1, itemsPerPage = 10, sortBy = 'created_at', sortOrder = 'DESC' }: UserFilter): PaginatedUsers {
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

    const allowedSortFields = ['name', 'username', 'created_at'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const paginatedQuery = `
    SELECT id, name, username, is_active, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY ${sortField} ${order}
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
        const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`);
        stmt.run(...params, id);
    }
    return findUserById(id);
}

/**
 * Soft delete a user
 */
export function softDeleteUser(id: number): boolean {
    const db = getDB();
    const stmt = db.prepare('UPDATE users SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL');
    const result = stmt.run(id);
    return result.changes > 0;
}

/**
 * Insert user and assign roles atomically
 */
export function insertUserWithRoles(
    userData: CreateUserInput,
    roleIds: number[] = []
): User | undefined {
    const db = getDB();
    const insertUserStmt = db.prepare(`
        INSERT INTO users (name, username, password_hash, is_active)
        VALUES (?, ?, ?, ?)
    `);
    const insertRoleStmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');

    const transaction = db.transaction((payload: CreateUserInput, roles: number[]) => {
        const result = insertUserStmt.run(
            payload.name,
            payload.username,
            payload.password_hash,
            payload.is_active ?? 1
        );
        const userId = Number(result.lastInsertRowid);

        for (const roleId of roles) {
            insertRoleStmt.run(userId, roleId);
        }

        return userId;
    });

    const userId = transaction(userData, roleIds);
    return findUserById(userId);
}

/**
 * Update user and optionally replace roles atomically
 */
export function updateUserWithRolesById(
    id: number,
    data: Partial<User>,
    roleIds?: number[]
): User | undefined {
    const db = getDB();
    const deleteRolesStmt = db.prepare('DELETE FROM user_roles WHERE user_id = ?');
    const insertRoleStmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');

    const transaction = db.transaction((userId: number, updateData: Partial<User>, nextRoleIds?: number[]) => {
        updateUserById(userId, updateData);

        if (nextRoleIds !== undefined) {
            deleteRolesStmt.run(userId);
            for (const roleId of nextRoleIds) {
                insertRoleStmt.run(userId, roleId);
            }
        }
    });

    transaction(id, data, roleIds);
    
    // Invalidate user sessions when roles change to force re-authentication
    if (roleIds !== undefined) {
        invalidateUserSessions(id);
    }
    
    return findUserById(id);
}

/**
 * Invalidate all sessions for a user (used when roles/permissions change)
 */
function invalidateUserSessions(userId: number): void {
    const db = getDB();
    const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
    stmt.run(userId);
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
 * Get all permissions for a user (via their roles + user-specific overrides)
 */
export function getUserPermissions(userId: number): string[] {
    const db = getDB();
    
    // Get permissions from roles
    const rolePermissions = db.prepare(`
        SELECT DISTINCT p.key
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
    `).all(userId) as { key: string }[];
    
    const rolePermKeys = new Set(rolePermissions.map(p => p.key));
    
    // Get user-specific permission overrides (if table exists)
    try {
        const userOverrides = db.prepare(`
            SELECT p.key, up.granted
            FROM permissions p
            JOIN user_permissions up ON p.id = up.permission_id
            WHERE up.user_id = ?
        `).all(userId) as { key: string; granted: number }[];
        
        // Apply overrides: granted=1 adds permission, granted=0 removes it
        for (const override of userOverrides) {
            if (override.granted === 1) {
                rolePermKeys.add(override.key);
            } else {
                rolePermKeys.delete(override.key);
            }
        }
    } catch (error) {
        // Table doesn't exist yet, skip user-specific permissions
    }
    
    return Array.from(rolePermKeys);
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
 * Grant or revoke a specific permission for a user
 */
export function setUserPermission(
    userId: number,
    permissionId: number,
    granted: boolean,
    modifiedBy?: number
): void {
    const db = getDB();
    try {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO user_permissions (user_id, permission_id, granted, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(userId, permissionId, granted ? 1 : 0);
        
        // Invalidate user sessions to force re-authentication with new permissions
        invalidateUserSessions(userId);
    } catch (error) {
        // Table might not exist yet (migration not run)
        throw new Error('User-specific permissions not available. Database schema may need updating.');
    }
}

/**
 * Remove a user-specific permission override
 */
export function removeUserPermission(userId: number, permissionId: number): void {
    const db = getDB();
    try {
        const stmt = db.prepare('DELETE FROM user_permissions WHERE user_id = ? AND permission_id = ?');
        stmt.run(userId, permissionId);
        
        // Invalidate user sessions to force re-authentication
        invalidateUserSessions(userId);
    } catch (error) {
        // Table might not exist yet
    }
}

/**
 * Get user-specific permission overrides
 */
export function getUserPermissionOverrides(userId: number): Array<{ permission_id: number; key: string; granted: number }> {
    const db = getDB();
    try {
        const query = `
            SELECT up.permission_id, p.key, up.granted
            FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = ?
        `;
        return db.prepare(query).all(userId) as Array<{ permission_id: number; key: string; granted: number }>;
    } catch (error) {
        return [];
    }
}

/**
 * Get all available roles
 */
export function getAllRoles(): Role[] {
    const db = getDB();
    return db.prepare('SELECT * FROM roles ORDER BY name ASC').all() as Role[];
}

export function getAllPermissions(): Permission[] {
    const db = getDB();
    return db.prepare('SELECT * FROM permissions ORDER BY key ASC').all() as Permission[];
}
