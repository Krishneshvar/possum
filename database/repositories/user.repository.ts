import { getDB } from '../../electron/backend/shared/db/index.js';
import { User, Role, Permission } from '../../types/index.js';
import type { IUserRepository, UserFilter, PaginatedUsers } from '../../core/index.js';

export class UserRepository implements IUserRepository {
  findUsers({ searchTerm, page, limit }: UserFilter): PaginatedUsers {
    const db = getDB();
    const currentPage = page || 1;
    const itemsPerPage = limit || 10;
    const filterClauses: string[] = ['deleted_at IS NULL'];
    const filterParams: any[] = [];

    if (searchTerm) {
      filterClauses.push('(name LIKE ? OR username LIKE ?)');
      filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    const whereClause = `WHERE ${filterClauses.join(' AND ')}`;
    const totalCount = (db.prepare(`SELECT COUNT(id) as total FROM users ${whereClause}`).get(...filterParams) as { total: number }).total;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const users = db.prepare(`SELECT id, name, username, is_active, created_at, updated_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...filterParams, itemsPerPage, startIndex) as User[];

    return { users, totalCount, totalPages: Math.ceil(totalCount / itemsPerPage) };
  }

  findUserById(id: number): User | undefined {
    const db = getDB();
    return db.prepare('SELECT id, name, username, is_active, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL').get(id) as User | undefined;
  }

  findUserByUsername(username: string): User | undefined {
    const db = getDB();
    return db.prepare('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL').get(username) as User | undefined;
  }

  insertUserWithRoles(userData: { name: string; username: string; password_hash: string; is_active?: number }, roleIds: number[]): User {
    const db = getDB();
    const tx = db.transaction(() => {
      const result = db.prepare('INSERT INTO users (name, username, password_hash, is_active) VALUES (?, ?, ?, ?)').run(userData.name, userData.username, userData.password_hash, userData.is_active ?? 1);
      const userId = Number(result.lastInsertRowid);
      for (const roleId of roleIds) {
        db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, roleId);
      }
      return userId;
    });
    const userId = tx();
    return this.findUserById(userId)!;
  }

  updateUserWithRolesById(id: number, data: Partial<User>, roleIds?: number[]): User {
    const db = getDB();
    const tx = db.transaction(() => {
      const updates: string[] = [];
      const params: any[] = [];
      if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
      if (data.username !== undefined) { updates.push('username = ?'); params.push(data.username); }
      if (data.password_hash !== undefined) { updates.push('password_hash = ?'); params.push(data.password_hash); }
      if (data.is_active !== undefined) { updates.push('is_active = ?'); params.push(data.is_active); }
      if (updates.length > 0) {
        db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params, id);
      }
      if (roleIds !== undefined) {
        db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);
        for (const roleId of roleIds) {
          db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(id, roleId);
        }
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
      }
    });
    tx();
    return this.findUserById(id)!;
  }

  softDeleteUser(id: number): boolean {
    const db = getDB();
    const result = db.prepare('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    return result.changes > 0;
  }

  getAllRoles(): Role[] {
    const db = getDB();
    return db.prepare('SELECT * FROM roles ORDER BY name ASC').all() as Role[];
  }

  getAllPermissions(): Permission[] {
    const db = getDB();
    return db.prepare('SELECT * FROM permissions ORDER BY key ASC').all() as Permission[];
  }

  getUserRoles(userId: number): Role[] {
    const db = getDB();
    return db.prepare('SELECT r.id, r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?').all(userId) as Role[];
  }

  getUserPermissions(userId: number): string[] {
    const db = getDB();
    // Get permissions from roles
    const rolePermissions = db.prepare(`
      SELECT DISTINCT p.key
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `).all(userId) as Array<{ key: string }>;

    const permissionSet = new Set(rolePermissions.map(p => p.key));

    // Apply user-specific permission overrides if the table exists
    try {
      const overrides = db.prepare(`
        SELECT p.key, up.granted
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = ?
      `).all(userId) as Array<{ key: string; granted: number }>;

      overrides.forEach(override => {
        if (override.granted === 1) {
          permissionSet.add(override.key);
        } else {
          permissionSet.delete(override.key);
        }
      });
    } catch {
      // user_permissions table might not exist in older schemas
    }

    return Array.from(permissionSet);
  }

  assignUserRoles(userId: number, roleIds: number[]): void {
    const db = getDB();
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
      for (const roleId of roleIds) {
        db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, roleId);
      }
    });
    tx();
  }

  getUserPermissionOverrides(userId: number): Array<{ permission_id: number; key: string; granted: number }> {
    const db = getDB();
    try {
      return db.prepare('SELECT up.permission_id, p.key, up.granted FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = ?').all(userId) as Array<{ permission_id: number; key: string; granted: number }>;
    } catch {
      return [];
    }
  }

  setUserPermission(userId: number, permissionId: number, granted: boolean): void {
    const db = getDB();
    try {
      db.prepare('INSERT OR REPLACE INTO user_permissions (user_id, permission_id, granted, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').run(userId, permissionId, granted ? 1 : 0);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    } catch {
      throw new Error('User-specific permissions not available');
    }
  }
}
